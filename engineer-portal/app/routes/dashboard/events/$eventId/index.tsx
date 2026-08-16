import toast from "react-hot-toast";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import http from "~/utils/http";
import { useEventDetails } from "~/routes/dashboard/events/repositories/use-event-details";
import {
  formatEventDateRange,
  getEventFilterLabel,
} from "~/routes/dashboard/events/utils";
import type { EventDetails } from "~/routes/dashboard/events/requests/get-event-details";

function formatDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatMoney(amount: number) {
  if (amount <= 0) return "Free";
  return `TZS ${amount.toLocaleString()}`;
}

function eventModeLabel(event: EventDetails) {
  if (!event.isOnline) return "In-person";
  if (event.location && event.location !== "Online") return "Hybrid";
  return "Online / Virtual";
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  if (children == null || children === "") return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-border/70 py-3 last:border-b-0 sm:grid-cols-[180px_1fr]">
      <dt className="text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground leading-relaxed">{children}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 shadow-xs">
      <h3 className="mb-3 text-sm font-bold text-[#7f1d1d]">{title}</h3>
      {children}
    </Card>
  );
}

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useEventDetails(eventId);
  const event = data?.data;
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const categoryLabel = useMemo(
    () => (event ? getEventFilterLabel(event.category) || event.category : ""),
    [event],
  );

  const registerMutation = useMutation({
    mutationFn: async (paymentMethod?: "SELCOM") => {
      const response = await http.post(`/events/${eventId}/register`, {
        attendeeType: "MEMBER",
        ...(paymentMethod ? { paymentMethod } : {}),
      });
      return response.data?.data;
    },
    onSuccess: async (result) => {
      if (result?.paymentUrl) {
        setPaymentDialogOpen(false);
        toast.success("Redirecting to payment gateway…");
        window.location.href = result.paymentUrl;
        return;
      }
      toast.success(
        (event?.registrationFee ?? 0) <= 0
          ? "Registration confirmed."
          : "Registration pending payment.",
      );
      setPaymentDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["event-details", eventId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-events"] });
      await queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? "Failed to register for this event.",
      );
    },
  });

  const canRegister =
    !!event &&
    !event.isRegistered &&
    !event.isFull &&
    event.registrationOpen &&
    !(
      event.registrationDeadline &&
      new Date() > new Date(event.registrationDeadline)
    );

  const registerLabel = event?.isRegistered
    ? "Already Registered"
    : event?.isFull
      ? "Event Full"
      : !event?.registrationOpen
        ? "Registration Closed"
        : event?.registrationDeadline &&
            new Date() > new Date(event.registrationDeadline)
          ? "Deadline Passed"
          : registerMutation.isPending
            ? "Registering…"
            : "Register for Event";

  function handleRegisterClick() {
    if (!event || !canRegister || registerMutation.isPending) return;
    if ((event.registrationFee ?? 0) > 0) {
      setPaymentDialogOpen(true);
      return;
    }
    registerMutation.mutate(undefined);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (isError || !event) {
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
              <BreadcrumbPage>Event details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card className="p-8 text-center shadow-xs">
          <p className="text-sm font-semibold text-[#7f1d1d]">Event not found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This event may be unpublished or no longer available.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate("/dashboard/events")}
          >
            Back to Events
          </Button>
        </Card>
      </div>
    );
  }

  const speakers = event.speakers?.filter((s) => s.name?.trim()) ?? [];
  const agenda = event.agenda?.filter((a) => a.time && a.title) ?? [];
  const agendaPdf = event.agendaPdf?.trim() || null;
  const requirements = event.requirements?.filter(Boolean) ?? [];
  const images = event.images?.filter(Boolean) ?? [];
  const organizer = event.organizer;
  const hasOrganizer =
    !!organizer?.name || !!organizer?.contact || !!organizer?.phone;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard/events">Events &amp; Training</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1 max-w-[280px] sm:max-w-md">
              {event.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.title}
                className="h-auto w-full"
              />
            ) : null}
            <div className="space-y-2 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{categoryLabel}</Badge>
                <Badge variant="secondary">{eventModeLabel(event)}</Badge>
                {event.isRegistered ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Registered
                  </Badge>
                ) : null}
                {event.isFull ? (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    Full
                  </Badge>
                ) : null}
              </div>
              <h1 className="text-xl font-extrabold leading-snug text-[#7f1d1d] sm:text-2xl">
                {event.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatEventDateRange(
                  event.startDate,
                  event.startTime,
                  event.endTime,
                )}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
          </div>

          <Section title="Overview">
            <dl>
              <DetailRow label="Category">{categoryLabel}</DetailRow>
              <DetailRow label="Mode">{eventModeLabel(event)}</DetailRow>
              <DetailRow label="Schedule">
                {formatEventDateRange(
                  event.startDate,
                  event.startTime,
                  event.endTime,
                )}
              </DetailRow>
              {event.endDate ? (
                <DetailRow label="Ends">
                  {formatEventDateRange(
                    event.endDate,
                    event.startTime,
                    event.endTime,
                  )}
                </DetailRow>
              ) : null}
              <DetailRow label="Venue">
                {event.location || (event.isOnline ? "Online" : "—")}
              </DetailRow>
              {event.onlineUrl ? (
                <DetailRow label="Online link">
                  <a
                    href={event.onlineUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-[#9b1c1c] underline"
                  >
                    {event.onlineUrl}
                  </a>
                </DetailRow>
              ) : null}
              <DetailRow label="Guest of honour">
                {event.guestOfHonor}
              </DetailRow>
              <DetailRow label="Description">
                {event.description || "No description provided."}
              </DetailRow>
            </dl>
          </Section>

          {speakers.length > 0 ? (
            <Section title="Speakers">
              <div className="space-y-4">
                {speakers.map((speaker, index) => (
                  <div
                    key={`${speaker.name}-${index}`}
                    className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    {speaker.photo ? (
                      <img
                        src={speaker.photo}
                        alt={speaker.name}
                        className="size-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#FADCDC] text-xs font-bold text-[#9b1c1c]">
                        {speaker.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{speaker.name}</p>
                      {speaker.title ? (
                        <p className="text-xs text-muted-foreground">
                          {speaker.title}
                        </p>
                      ) : null}
                      {speaker.bio ? (
                        <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                          {speaker.bio}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {agenda.length > 0 || agendaPdf ? (
            <Section title="Agenda">
              {agendaPdf ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">Full agenda (PDF)</p>
                    <p className="text-xs text-muted-foreground">
                      Download the complete programme
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <a href={agendaPdf} target="_blank" rel="noreferrer">
                      Download PDF
                    </a>
                  </Button>
                </div>
              ) : null}
              {agenda.length > 0 ? (
                <div className="space-y-3">
                  {agenda.map((item, index) => (
                    <div
                      key={`${item.time}-${item.title}-${index}`}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#9b1c1c]">
                        {item.time}
                      </p>
                      <p className="mt-1 text-sm font-semibold">{item.title}</p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </Section>
          ) : null}

          {images.length > 0 ? (
            <Section title="Gallery">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image) => (
                  <a
                    key={image}
                    href={image}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={image}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </Section>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <Section title="Registration">
            <dl>
              <DetailRow label="Fee">
                {formatMoney(event.registrationFee ?? 0)}
              </DetailRow>
              {event.feePricingMode === "DIFFERENT" ? (
                <DetailRow label="Fee rates">
                  {`Active members ${formatMoney(event.memberRegistrationFee ?? 0)} · Others ${formatMoney(event.nonMemberRegistrationFee ?? event.registrationFee ?? 0)}`}
                </DetailRow>
              ) : null}
              <DetailRow label="CPD hours">
                {event.cpdPoints > 0 ? event.cpdPoints : "None"}
              </DetailRow>
              <DetailRow label="Capacity">
                {event.maxParticipants
                  ? `${event.registeredCount ?? 0} / ${event.maxParticipants}`
                  : "Unlimited"}
              </DetailRow>
              <DetailRow label="Deadline">
                {formatDate(event.registrationDeadline) || "No deadline"}
              </DetailRow>
              <DetailRow label="Status">
                {event.registrationOpen ? "Open" : "Closed"}
              </DetailRow>
            </dl>
            <Button
              className="mt-4 w-full bg-[#9b1c1c] text-white hover:bg-[#7f1d1d]"
              disabled={!canRegister || registerMutation.isPending}
              onClick={handleRegisterClick}
            >
              {registerLabel}
            </Button>
          </Section>

          {requirements.length > 0 ? (
            <Section title="Requirements">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                {requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          {hasOrganizer ? (
            <Section title="Organizer">
              <dl>
                <DetailRow label="Name">{organizer?.name}</DetailRow>
                <DetailRow label="Contact">{organizer?.contact}</DetailRow>
                <DetailRow label="Phone">{organizer?.phone}</DetailRow>
              </dl>
            </Section>
          ) : null}
        </div>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete registration payment</DialogTitle>
            <DialogDescription>{event.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registration fee</span>
              <span className="font-semibold">
                {formatMoney(event.registrationFee ?? 0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              You will be redirected to Selcom to complete payment securely.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={registerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#9b1c1c] text-white hover:bg-[#7f1d1d]"
              disabled={registerMutation.isPending}
              onClick={() => registerMutation.mutate("SELCOM")}
            >
              {registerMutation.isPending
                ? "Redirecting…"
                : "Pay & Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
