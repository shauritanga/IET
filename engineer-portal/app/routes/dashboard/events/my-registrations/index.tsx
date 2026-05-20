import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { Calendar, MapPoint, Ticket } from "@solar-icons/react/ssr";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { getEventFilterLabel } from "~/routes/dashboard/events/utils";
import {
  getMyRegistrations,
  type MyRegistration,
} from "~/routes/dashboard/events/my-registrations/requests/get-my-registrations";
import { retryEventPayment } from "~/routes/dashboard/events/my-registrations/requests/retry-event-payment";

const STATUS_LABELS: Record<MyRegistration["status"], string> = {
  CONFIRMED: "Confirmed",
  PENDING_PAYMENT: "Pending Payment",
  CANCELLED: "Cancelled",
  ATTENDED: "Attended",
  NO_SHOW: "No Show",
  EXPIRED: "Expired",
};

const STATUS_CLASSES: Record<MyRegistration["status"], string> = {
  CONFIRMED: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  PENDING_PAYMENT: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  CANCELLED: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  ATTENDED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  NO_SHOW: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
  EXPIRED: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function isRegistrationOpen(reg: MyRegistration): boolean {
  if (!reg.event.registrationOpen) return false;
  if (reg.event.registrationDeadline && new Date() > new Date(reg.event.registrationDeadline)) return false;
  return true;
}

function RegistrationCard({ reg }: { reg: MyRegistration }) {
  const categoryLabel = getEventFilterLabel(reg.event.category) || reg.event.category;
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const retryMutation = useMutation({
    mutationFn: () => retryEventPayment(reg.registrationId),
    onMutate: () => {
      setRetrying(true);
      setRetryError(null);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      window.location.href = data.paymentUrl;
    },
    onError: (err: Error) => {
      setRetrying(false);
      setRetryError(err.message || "Failed to initiate payment. Please try again.");
    },
  });

  const canRetry =
    (reg.status === "PENDING_PAYMENT" || reg.status === "EXPIRED") &&
    isRegistrationOpen(reg);

  return (
    <Card className="w-full p-4 flex flex-col gap-3 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 size-10 bg-[#FADCDC] rounded-lg flex justify-center items-center">
            <Calendar className="text-[#E20C0A] size-6" weight="BoldDuotone" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold mb-1 truncate">{reg.event.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(reg.event.startDate)}
              </span>
              {reg.event.location && (
                <span className="flex items-center gap-1">
                  <MapPoint className="size-3" />
                  {reg.event.location}
                </span>
              )}
              {reg.ticketNumber && (
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Ticket className="size-3" />
                  {reg.ticketNumber}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:shrink-0 pl-[52px] sm:pl-0">
          <Badge variant="outline">{categoryLabel}</Badge>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[reg.status]}`}
          >
            {STATUS_LABELS[reg.status]}
          </span>
        </div>
      </div>

      {reg.status === "PENDING_PAYMENT" && reg.paymentExpiresAt && (
        <p className="text-xs text-amber-700 dark:text-amber-400 pl-[52px] sm:pl-0">
          Payment window closes in {formatTimeRemaining(reg.paymentExpiresAt)}
        </p>
      )}

      {retryError && (
        <p className="text-xs text-red-600 pl-[52px] sm:pl-0">{retryError}</p>
      )}

      {canRetry && (
        <div className="pl-[52px] sm:pl-0">
          <Button
            size="sm"
            variant="default"
            disabled={retrying}
            onClick={() => retryMutation.mutate()}
            className="bg-[#9b1c1c] hover:bg-[#7f1d1d] text-white text-xs"
          >
            {retrying
              ? "Redirecting to payment..."
              : reg.status === "EXPIRED"
              ? "Re-initiate Payment"
              : "Continue Payment"}
          </Button>
        </div>
      )}

      {reg.status === "EXPIRED" && !isRegistrationOpen(reg) && (
        <p className="text-xs text-muted-foreground pl-[52px] sm:pl-0">
          Registration for this event is closed.
        </p>
      )}
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-full h-20 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export default function MyRegistrationsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => getMyRegistrations({ limit: 100 }),
  });

  const registrations = data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard/events">Events &amp; Training</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>My Registrations</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">My Registrations</h2>
        {!isLoading && !isError && (
          <Badge variant="secondary">{registrations.length}</Badge>
        )}
      </div>

      {isLoading && <LoadingState />}

      {isError && (
        <p className="text-sm text-muted-foreground text-center py-10">
          Failed to load registrations. Please try again.
        </p>
      )}

      {!isLoading && !isError && registrations.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">
          You have not registered for any events yet.
        </p>
      )}

      {!isLoading && !isError && registrations.length > 0 && (
        <div className="flex flex-col gap-3">
          {registrations.map((reg) => (
            <RegistrationCard key={reg.registrationId} reg={reg} />
          ))}
        </div>
      )}
    </div>
  );
}
