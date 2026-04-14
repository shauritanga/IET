import {
    Calendar,
    CalendarCurrentDate, CalendarMonthView,
    CalendarNextTrigger,
    CalendarPrevTrigger, 
} from "~/components/custom/full-calendar";
import {ChevronLeft, ChevronRight} from "lucide-react";

const CalendarView = () => {
    return (
        <Calendar
            events={[
                {
                    id: '1',
                    start: new Date('2025-11-20T09:30:00Z'),
                    end: new Date('2025-11-20T14:30:00Z'),
                    title: 'event A',
                    color: 'pink',
                },
                {
                    id: '2',
                    start: new Date('2025-11-20T10:00:00Z'),
                    end: new Date('2025-11-20T10:30:00Z'),
                    title: 'event B',
                    color: 'blue',
                },
            ]}
        >
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
    );
};

export default CalendarView;