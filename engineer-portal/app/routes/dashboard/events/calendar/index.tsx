import { useMemo } from "react";
import {
    Calendar,
    CalendarCurrentDate,
    CalendarMonthView,
    CalendarNextTrigger,
    CalendarPrevTrigger,
} from "~/components/custom/full-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEvents } from "~/routes/dashboard/events/repositories/use-events";
import { mapDashboardEventToCalendar } from "~/routes/dashboard/events/utils";

const CalendarView = () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, isLoading, isError } = useEvents({ limit: 100, fromDate: today });
    const events = useMemo(
        () => (data?.data ?? []).map(mapDashboardEventToCalendar),
        [data],
    );

    return (
        <div className="space-y-4">
            {isLoading ? (
                <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
                    Loading events...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                    Unable to load events right now.
                </div>
            ) : null}

            <Calendar events={events}>
                <div className="h-dvh py-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <CalendarPrevTrigger>
                            <ChevronLeft size={20} />
                            <span className="sr-only">Previous</span>
                        </CalendarPrevTrigger>
                        <CalendarNextTrigger>
                            <ChevronRight size={20} />
                            <span className="sr-only">Next</span>
                        </CalendarNextTrigger>
                        <CalendarCurrentDate />
                    </div>

                    <div className="flex-1 overflow-auto relative">
                        <CalendarMonthView />
                    </div>
                </div>
            </Calendar>
        </div>
    );
};

export default CalendarView;
