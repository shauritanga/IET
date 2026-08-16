import { Calendar, Eye } from "@solar-icons/react/ssr";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router";
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
import type { PortalEventCard } from "~/routes/dashboard/events/utils";
import http from "~/utils/http";

type Props = {
  event: PortalEventCard;
};

const EventListItem = ({ event }: Props) => {
  const queryClient = useQueryClient();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (paymentMethod?: "SELCOM") => {
      const response = await http.post(`/events/${event.id}/register`, {
        attendeeType: "MEMBER",
        ...(paymentMethod ? { paymentMethod } : {}),
      });
      return response.data?.data;
    },
    onSuccess: async (result) => {
      if (result?.paymentUrl) {
        setPaymentOpen(false);
        toast.success("Redirecting to payment gateway…");
        window.location.href = result.paymentUrl;
        return;
      }
      toast.success(
        event.free ? "Registration confirmed." : "Registration pending payment.",
      );
      setPaymentOpen(false);
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
    !event.isRegistered && !event.isFull && !registerMutation.isPending;

  const registerLabel = event.isRegistered
    ? "Registered"
    : event.isFull
      ? "Full"
      : registerMutation.isPending
        ? "Registering…"
        : "Register";

  function handleRegister() {
    if (!canRegister) return;
    if (!event.free) {
      setPaymentOpen(true);
      return;
    }
    registerMutation.mutate(undefined);
  }

  return (
    <>
      <Card className="w-full flex flex-row gap-0 p-4 justify-between items-center shadow-xs">
        <div className="flex items-start lg:items-start gap-2">
          <div className="shrink-0 size-8 lg:size-10 bg-[#FADCDC] rounded-lg flex justify-center items-center">
            <Calendar
              className="text-[#E20C0A] size-6 lg:size-6"
              weight="BoldDuotone"
            />
          </div>
          <div>
            <p className="text-sm lg:text-base font-medium mb-1">{event.title}</p>
            <p className="text-xs text-muted-foreground mb-1">
              {event.start} | {event.venue}
            </p>
            {event.guest ? (
              <p className="text-xs font-light text-muted-foreground">
                <span className="font-semibold">Guest of honor:</span> {event.guest}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>
            {event.free ? "Free" : `TZS ${event.price.toLocaleString()}`}
          </Badge>
          <Badge variant="outline">{event.type}</Badge>
          <Button className="hidden lg:block rounded-xl" variant="outline" asChild>
            <Link to={`/dashboard/events/${event.id}`}>View Details</Link>
          </Button>
          <Button
            className="shrink-0 lg:hidden rounded-lg h-0 w-0 !p-4"
            variant="outline"
            asChild
          >
            <Link to={`/dashboard/events/${event.id}`} aria-label="View details">
              <Eye />
            </Link>
          </Button>
          <Button
            className="rounded-xl bg-[#9b1c1c] text-white hover:bg-[#7f1d1d]"
            disabled={!canRegister}
            onClick={handleRegister}
          >
            {registerLabel}
          </Button>
        </div>
      </Card>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete registration payment</DialogTitle>
            <DialogDescription>{event.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registration fee</span>
              <span className="font-semibold">
                {event.free ? "Free" : `TZS ${event.price.toLocaleString()}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              You will be redirected to Selcom to complete payment securely.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentOpen(false)}
              disabled={registerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#9b1c1c] text-white hover:bg-[#7f1d1d]"
              disabled={registerMutation.isPending}
              onClick={() => registerMutation.mutate("SELCOM")}
            >
              {registerMutation.isPending ? "Redirecting…" : "Pay & Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventListItem;
