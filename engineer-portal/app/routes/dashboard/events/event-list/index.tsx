import { useMemo } from "react";
import { Input } from "~/components/ui/input";
import { useEvents } from "~/routes/dashboard/events/repositories/use-events";
import { mapDashboardEventToCard } from "~/routes/dashboard/events/utils";
import EventListItem from "~/routes/dashboard/events/event-list/fragments/event-list-item";

const EventsLoadingState = () => (
    <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
            <div key={i} className="w-full h-20 rounded-lg bg-muted animate-pulse" />
        ))}
    </div>
);

const Events = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDateStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const { data, isLoading, isError } = useEvents({ limit: 100, fromDate: fromDateStr });

    const events = useMemo(
        () => (data?.data ?? []).map(mapDashboardEventToCard),
        [data],
    );

    return (
        <>
            <div className={"flex items-center gap-2 w-full mb-4"}>
                <Input className={"w-full lg:w-96"} placeholder="Search events…" readOnly />
            </div>

            {isLoading && <EventsLoadingState />}

            {isError && (
                <p className="text-sm text-muted-foreground text-center py-8">
                    Failed to load events. Please try again.
                </p>
            )}

            {!isLoading && !isError && events.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No upcoming events at the moment.
                </p>
            )}

            <div className={"w-full flex flex-col gap-3"}>
                {events.map((event) => (
                    <EventListItem key={event.id} event={event} />
                ))}
            </div>
        </>
    );
};

export default Events;
