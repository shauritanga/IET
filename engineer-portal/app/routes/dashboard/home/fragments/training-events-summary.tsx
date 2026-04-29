import { Link } from "react-router"

type EventItem = {
    day: number
    month: string
    title: string
    meta: string
    dark?: boolean
}

const events: EventItem[] = [
    {
        day: 15,
        month: "Mar",
        title: "IET Annual Engineering Conference",
        meta: "Dar es Salaam · 08:00–17:00",
    },
    {
        day: 22,
        month: "Mar",
        title: "BIM & Digital Engineering Training",
        meta: "Online · 09:00–13:00",
        dark: true,
    },
    {
        day: 5,
        month: "Apr",
        title: "Structural Engineering Seminar",
        meta: "Arusha · 09:00–17:00",
    },
    {
        day: 18,
        month: "Apr",
        title: "Road Infrastructure Workshop",
        meta: "Dodoma · 09:00–16:00",
        dark: true,
    },
]

const UpcomingEvents = () => (
    <div className="bg-white rounded-[14px] border border-[#E8D5D5] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#E8D5D5]">
            <span className="text-[13px] font-bold text-[#390909]">Upcoming Events</span>
            <Link to="/dashboard/events" className="text-[11.5px] text-[#E20C0A] font-semibold no-underline hover:underline">
                All events
            </Link>
        </div>
        <div className="px-5 py-1">
            {events.map((evt, i) => (
                <div
                    key={i}
                    className={`flex items-center gap-3 py-[10px] ${i < events.length - 1 ? "border-b border-[#E8D5D5]" : ""}`}
                >
                    <div
                        className={`w-10 min-w-[40px] h-11 rounded-[10px] flex flex-col items-center justify-center leading-none text-white ${evt.dark ? "bg-[#390909]" : "bg-[#E20C0A]"}`}
                    >
                        <span className="text-[17px] font-extrabold font-serif">{evt.day}</span>
                        <span className="text-[9px] uppercase text-white/70 tracking-[.5px] mt-[2px]">{evt.month}</span>
                    </div>
                    <div>
                        <strong className="text-[12px] font-semibold text-[#1C1010] block">{evt.title}</strong>
                        <span className="text-[11px] text-[#7A6060]">{evt.meta}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
)

export default UpcomingEvents
