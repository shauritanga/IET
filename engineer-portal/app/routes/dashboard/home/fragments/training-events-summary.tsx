import {useState} from "react";
import {Link} from "react-router";
import {Calendar} from "~/components/ui/calendar";
import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";
import {Skeleton} from "~/components/ui/skeleton";
import {useUpcomingEvents} from "../repositories/useUpcomingEvents";
import type {DashboardEvent} from "../type";

const fallbackEvents: DashboardEvent[] = [
    {
        id: "fallback-1",
        title: "World engineering day for sustainable development",
        category: "CONFERENCE",
        startDate: "2025-10-27",
        startTime: "08:00",
        endTime: "12:00",
        location: "Karimjee Hall Dar es salaam",
        isOnline: false,
        guestOfHonor: "Eng. Emmanuel Ole Kambainei",
    },
    {
        id: "fallback-2",
        title: "A webinar of engineering code of ethics",
        category: "ONLINE_SEMINAR",
        startDate: "2025-10-27",
        startTime: "08:00",
        endTime: "12:00",
        location: "Online",
        isOnline: true,
        guestOfHonor: "Eng. Emmanuel Ole Kambainei",
    },
];

const categoryLabel = (category: string) => {
    switch (category) {
        case "CONFERENCE":
            return "Conferences";
        case "ONLINE_SEMINAR":
            return "Online Seminars";
        case "SEMINAR":
            return "Seminars";
        case "WORKSHOP":
            return "Workshops";
        case "CPD_COURSE":
            return "CPD Courses";
        default:
            return category.replaceAll("_", " ");
    }
};

const categoryClasses = (category: string) => {
    switch (category) {
        case "CONFERENCE":
            return "bg-[#DDF7E5] text-[#55AF6F]";
        case "ONLINE_SEMINAR":
            return "bg-[#F9EDB6] text-[#C6A32B]";
        default:
            return "bg-[#EEE8E8] text-[#7A6460]";
    }
};

const formatEventDate = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

const formatEventTime = (value: string) =>
    new Date(`1970-01-01T${value}:00`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

const formatEventSchedule = (event: DashboardEvent) => {
    const location = event.isOnline ? "Online" : event.location;
    return `${formatEventDate(event.startDate)}  |  ${formatEventTime(event.startTime)} - ${formatEventTime(event.endTime)}  |  ${location}`;
};

const EventCard = ({event}: { event: DashboardEvent }) => (
    <article className="rounded-[24px] border border-[#EFE6E2] bg-white p-5 shadow-[0_8px_24px_rgba(108,78,67,0.06)]">
        <div className="mb-4 flex items-start justify-between gap-4">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${categoryClasses(event.category)}`}>
                {categoryLabel(event.category)}
            </span>
            <Button
                variant="outline"
                className="h-10 rounded-full border-[#E7DDDA] px-4 text-xs font-semibold text-[#5E4743] shadow-none"
                asChild
            >
                <Link to="/dashboard/events">More details</Link>
            </Button>
        </div>

        <div className="space-y-2 text-[#4A2F2A]">
            <h3 className="text-lg font-semibold leading-6">{event.title}</h3>
            <p className="text-sm font-medium text-[#7E6662]">{formatEventSchedule(event)}</p>
            <p className="text-sm text-[#8C7570]">
                <span className="font-semibold text-[#5A423E]">Guest of Honour:</span>{" "}
                {event.guestOfHonor || event.speaker || "To be announced"}
            </p>
        </div>
    </article>
);

const TrainingEventsSummary = () => {
    const {data, isPending} = useUpcomingEvents();
    const events = data?.data?.length ? data.data : fallbackEvents;
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        events[0] ? new Date(events[0].startDate) : new Date(),
    );

    return (
        <Card className="gap-4 rounded-[30px] border border-[#EEE4E1] bg-white p-3 shadow-[0_18px_48px_rgba(95,69,60,0.08)]">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
                <div className="rounded-[24px] border border-[#F0E7E4] bg-[#FBF7F6] p-3">
                    {isPending ? (
                        <Skeleton className="h-[280px] w-full rounded-[20px]" />
                    ) : (
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            showOutsideDays
                            className="w-full rounded-[20px] bg-transparent p-2"
                            classNames={{
                                month_caption: "flex h-10 w-full items-center justify-center px-12 text-base font-semibold text-[#5A3831]",
                                button_previous: "size-9 rounded-full border border-[#E7DDDA] bg-white text-[#7D635E]",
                                button_next: "size-9 rounded-full border border-[#E7DDDA] bg-white text-[#7D635E]",
                                weekdays: "mb-2 flex",
                                weekday: "flex-1 text-center text-xs font-semibold uppercase tracking-wide text-[#9D8883]",
                                week: "mt-1 flex w-full",
                                day: "relative aspect-square w-full p-1",
                                outside: "text-[#CBBEBA]",
                                day_button: "h-10 w-10 rounded-2xl text-sm font-medium text-[#5B3D37] hover:bg-[#F2E8E5] data-[selected-single=true]:bg-[#D84333] data-[selected-single=true]:text-white",
                                today: "rounded-2xl border border-[#E9796D] bg-transparent text-[#D84333]",
                            }}
                        />
                    )}
                </div>

                <div className="rounded-[24px] border border-[#F0E7E4] bg-[#FFFCFB] p-4">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-[#4A2F2A]">
                            Upcoming Trainings & Events
                        </h2>
                        <Button
                            variant="ghost"
                            asChild
                            className="h-10 rounded-full bg-[#F7F0EE] px-4 text-xs font-semibold text-[#6B5450]"
                        >
                            <Link to="/dashboard/events">View all</Link>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {isPending ? (
                            <>
                                <Skeleton className="h-40 w-full rounded-[24px]" />
                                <Skeleton className="h-40 w-full rounded-[24px]" />
                            </>
                        ) : (
                            events.slice(0, 2).map((event) => <EventCard key={event.id} event={event} />)
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TrainingEventsSummary;
