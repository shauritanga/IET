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
    <div style={{ background: "var(--iet-white)", borderRadius: 14, border: "1px solid var(--iet-border)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--iet-border)" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--iet-red-dark)" }}>Upcoming Events</span>
            <Link to="/dashboard/events" style={{ fontSize: 11.5, color: "var(--iet-red)", fontWeight: 600, textDecoration: "none" }}>
                All events
            </Link>
        </div>
        <div style={{ padding: "0 20px" }}>
            {events.map((evt, i) => (
                <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < events.length - 1 ? "1px solid var(--iet-border)" : "none" }}
                >
                    <div
                        style={{ width: 40, minWidth: 40, height: 44, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1, color: "white", background: evt.dark ? "var(--iet-red-dark)" : "var(--iet-red)" }}
                    >
                        <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "Source Serif 4, serif" }}>{evt.day}</span>
                        <span style={{ fontSize: 9, textTransform: "uppercase", color: "rgba(255,255,255,.7)", letterSpacing: ".5px", marginTop: 2 }}>{evt.month}</span>
                    </div>
                    <div>
                        <strong style={{ fontSize: 12, fontWeight: 600, color: "var(--iet-text)", display: "block" }}>{evt.title}</strong>
                        <span style={{ fontSize: 11, color: "var(--iet-muted)" }}>{evt.meta}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
)

export default UpcomingEvents
