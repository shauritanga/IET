import type { CSSProperties, ReactNode } from "react"
import { useMemo, useState } from "react"
import { Link } from "react-router"
import { BookIcon, CalendarIcon, CheckIcon, ChevronDownIcon, ClockIcon, CloseIcon, DollarIcon, FileIcon, GridIcon, ListIcon, PaymentIcon, SearchIcon, StarIcon, UserIcon, UsersIcon } from "~/components/portal/icons"
import { membershipBenefits, paymentHistory, profileDocumentItems, type KpiItem } from "~/components/portal/mock-data"
import { useUpcomingEvents } from "~/routes/dashboard/home/repositories/useUpcomingEvents"
import { useEvents } from "~/routes/dashboard/events/repositories/use-events"
import { mapDashboardEventToCard, type PortalEventCard } from "~/routes/dashboard/events/utils"

const EVENT_TYPE_FILTERS = [
    { value: "", label: "All Types" },
    { value: "CONFERENCE", label: "Conference" },
    { value: "WORKSHOP", label: "Workshop" },
    { value: "SEMINAR", label: "Seminar" },
    { value: "CPD_COURSE", label: "CPD Course" },
    { value: "ONLINE_SEMINAR", label: "Online Seminar" },
    { value: "AGM", label: "AGM" },
    { value: "NETWORKING", label: "Networking" },
] as const

const iconMap = {
    star: StarIcon,
    clock: ClockIcon,
    calendar: CalendarIcon,
    payment: PaymentIcon,
    check: CheckIcon,
    file: FileIcon,
    user: UserIcon,
    book: BookIcon,
    users: UsersIcon,
    dollar: DollarIcon,
} as const


const PageHeader = ({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--iet-red-dark)" }}>{title}</h3>
            <p style={{ fontSize: 11.5, color: "var(--iet-muted)", marginTop: 2 }}>{subtitle}</p>
        </div>
        {action}
    </div>
)

const KpiGrid = ({ items, columns = 4 }: { items: KpiItem[]; columns?: number }) => (
    <div className="kpi-grid" style={columns === 4 ? undefined : { gridTemplateColumns: `repeat(${columns},1fr)` }}>
        {items.map((item) => {
            const Icon = iconMap[item.icon]
            return (
                <div key={item.label} className="kpi">
                    <div className="kpi-icon" style={item.iconClassName ? cssTextToObject(item.iconClassName) : undefined}>
                        <Icon width="17" height="17" />
                    </div>
                    <div className="kpi-val" style={item.valueClassName ? cssTextToObject(item.valueClassName) : undefined}>{item.value}</div>
                    <div className="kpi-lbl">{item.label}</div>
                    <div className={`kpi-note ${item.noteVariant === "ok" ? "ok" : ""}`}>{item.note}</div>
                </div>
            )
        })}
    </div>
)

function cssTextToObject(text: string): CSSProperties {
    return text.split(";").filter(Boolean).reduce<CSSProperties>((acc, part) => {
        const [key, value] = part.split(":")
        if (!key || !value) return acc
        const camel = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        ;(acc as Record<string, string>)[camel] = value.trim()
        return acc
    }, {})
}

export const DashboardOverviewPage = () => {
    const { data, isLoading, isError } = useUpcomingEvents()
    const upcomingEvents = useMemo(
        () => (data?.data ?? []).map(mapDashboardEventToCard),
        [data],
    )

    return (
        <div>
            <div className="kpi-grid">
                <div className="kpi">
                    <div className="kpi-icon"><StarIcon width="17" height="17" /></div>
                    <div className="kpi-val">2019</div>
                    <div className="kpi-lbl">Member Since</div>
                    <div className="kpi-note ok">✓ 6 years active</div>
                </div>
                <div className="kpi">
                    <div className="kpi-icon"><ClockIcon width="17" height="17" /></div>
                    <div className="kpi-val">36</div>
                    <div className="kpi-lbl">CPD Hours (2024)</div>
                    <div className="kpi-note ok">↑ 12 hrs above target</div>
                </div>
                <div className="kpi">
                    <div className="kpi-icon"><CalendarIcon width="17" height="17" /></div>
                    <div className="kpi-val">5</div>
                    <div className="kpi-lbl">Events Attended</div>
                    <div className="kpi-note ok">↑ 2 this quarter</div>
                </div>
                <div className="kpi">
                    <div className="kpi-icon"><PaymentIcon width="17" height="17" /></div>
                    <div className="kpi-val" style={{ fontSize: 20 }}>TZS 0</div>
                    <div className="kpi-lbl">Outstanding Balance</div>
                    <div className="kpi-note ok">✓ All dues cleared</div>
                </div>
            </div>

            <div className="dash-grid">
                <div className="card">
                    <div className="card-head"><span className="card-title">Recent Activity</span><span className="card-action">View all</span></div>
                    <div className="card-body">
                        <div className="activity-row">
                            <div className="a-icon"><PaymentIcon width="14" height="14" /></div>
                            <div>
                                <div className="a-text">Annual subscription paid — <strong>TZS 150,000</strong></div>
                                <div className="a-time">Jan 10, 2025 · M-Pesa</div>
                            </div>
                        </div>
                        <div className="activity-row">
                            <div className="a-icon" style={{ background: "#E8F5E9", color: "#1a6b3c" }}><CalendarIcon width="14" height="14" /></div>
                            <div>
                                <div className="a-text">Attended "Sustainable Infrastructure" Seminar — <strong>6 CPD hrs</strong></div>
                                <div className="a-time">Dec 14, 2024 · Dar es Salaam</div>
                            </div>
                        </div>
                        <div className="activity-row">
                            <div className="a-icon" style={{ background: "#FFF8E1", color: "#F57F17" }}><FileIcon width="14" height="14" /></div>
                            <div>
                                <div className="a-text">Uploaded CPD Activity Record for Q4 2024</div>
                                <div className="a-time">Dec 8, 2024</div>
                            </div>
                        </div>
                        <div className="activity-row">
                            <div className="a-icon"><CheckIcon width="14" height="14" /></div>
                            <div>
                                <div className="a-text">Registered for Construction Innovation Workshop</div>
                                <div className="a-time">Nov 29, 2024</div>
                            </div>
                        </div>
                        <div className="activity-row">
                            <div className="a-icon" style={{ background: "#E8F5E9", color: "#1a6b3c" }}><UserIcon width="14" height="14" /></div>
                            <div>
                                <div className="a-text">Profile information updated</div>
                                <div className="a-time">Nov 22, 2024</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-head">
                        <span className="card-title">Upcoming Events</span>
                        <Link to="/dashboard/events" className="card-action">All events</Link>
                    </div>
                    <div className="card-body">
                        {isLoading ? (
                            <div className="py-4 text-[11.5px] text-[#7A6060]">Loading upcoming events...</div>
                        ) : isError ? (
                            <div className="py-4 text-[11.5px] text-[#B3261E]">Unable to load events right now.</div>
                        ) : upcomingEvents.length === 0 ? (
                            <div className="py-4 text-[11.5px] text-[#7A6060]">No upcoming events found.</div>
                        ) : (
                            upcomingEvents.map((evt) => (
                                <div key={evt.id} className="evt-row">
                                    <div className={`date-box ${evt.mode === "Online" ? "bg-[var(--iet-red-dark)]" : ""}`}>
                                        <span className="d">{evt.date.split(" ")[1]?.replace(",", "")}</span>
                                        <span className="m">{evt.date.split(" ")[0]}</span>
                                    </div>
                                    <div className="evt-details">
                                        <strong>{evt.title}</strong>
                                        <span>{evt.location} · {evt.start.split(" | ")[1] ?? evt.start}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const DashboardPaymentPage = () => (
    <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--iet-red-dark)" }}>Payments</h3>
                <p style={{ fontSize: 11.5, color: "var(--iet-muted)", marginTop: 2 }}>Manage your subscription and transaction history</p>
            </div>
            <button className="btn btn-red">+ Make Payment</button>
        </div>

        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <div className="kpi">
                <div className="kpi-icon"><PaymentIcon width="17" height="17" /></div>
                <div className="kpi-val">150,000</div>
                <div className="kpi-lbl">Total Paid (2025) · TZS</div>
                <div className="kpi-note ok">✓ Annual Subscription</div>
            </div>
            <div className="kpi">
                <div className="kpi-icon" style={{ background: "#E8F5E9", color: "#1a6b3c" }}><CheckIcon width="17" height="17" /></div>
                <div className="kpi-val" style={{ color: "#1a6b3c" }}>0</div>
                <div className="kpi-lbl">Outstanding Balance · TZS</div>
                <div className="kpi-note ok">✓ Fully settled</div>
            </div>
            <div className="kpi">
                <div className="kpi-icon"><CalendarIcon width="17" height="17" /></div>
                <div className="kpi-val" style={{ fontSize: 22 }}>May 2025</div>
                <div className="kpi-lbl">Next Due Date</div>
                <div className="kpi-note">Annual renewal reminder</div>
            </div>
        </div>

        <div className="card">
            <div className="card-head"><span className="card-title">Transaction History</span><button className="btn btn-outline btn-sm">⬇ Download PDF</button></div>
            <table>
                <thead><tr><th>Ref No.</th><th>Description</th><th>Date</th><th>Amount (TZS)</th><th>Method</th><th>Status</th></tr></thead>
                <tbody>
                    {paymentHistory.map((item) => (
                        <tr key={item.ref}>
                            <td><strong>{item.ref}</strong></td>
                            <td>{item.description}</td>
                            <td>{item.date}</td>
                            <td>{item.amount}</td>
                            <td>{item.method}</td>
                            <td><span className="badge b-green">{item.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)

export const DashboardMembershipPage = ({ onApplyForMembership }: { onApplyForMembership?: () => void }) => (
    <div>
        <PageHeader
            title="Membership"
            subtitle="Your IET Tanzania membership details and benefits"
            action={<button className="btn btn-red" onClick={onApplyForMembership}>+ Apply for Membership</button>}
        />
        <div className="benefits-grid">
            {membershipBenefits.map((benefit) => {
                const Icon = iconMap[benefit.icon]
                return (
                    <div key={benefit.title} className="ben-card">
                        <div className="ben-ico"><Icon width="16" height="16" /></div>
                        <div><h4>{benefit.title}</h4><p>{benefit.description}</p></div>
                    </div>
                )
            })}
        </div>
        <div className="card">
            <div className="card-head">
                <span className="card-title">CPD Progress – 2024</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1a6b3c" }}>36 / 24 hrs &nbsp;✓ Target Met</span>
            </div>
            <div className="card-body">
                <p style={{ fontSize: 12, color: "var(--iet-muted)", marginBottom: 14 }}>You exceeded the minimum 24 CPD hours required for 2024.</p>
                <div className="cpd-wrap">
                    <div className="cpd-item"><h4>Technical Activities — 22 hrs</h4><div className="cpd-bar-bg"><div className="cpd-bar" style={{ width: "92%" }} /></div><div className="cpd-meta"><span>0</span><span>22 / 24 hrs</span></div></div>
                    <div className="cpd-item"><h4>Managerial Activities — 14 hrs</h4><div className="cpd-bar-bg"><div className="cpd-bar" style={{ width: "58%" }} /></div><div className="cpd-meta"><span>0</span><span>14 / 24 hrs</span></div></div>
                </div>
            </div>
        </div>
    </div>
)

export const DashboardProfilePage = () => (
    <div>
        <PageHeader title="My Profile" subtitle="Manage your personal and professional information" action={<button className="btn btn-red">Save Changes</button>} />
        <div className="profile-hero">
            <div className="p-ava">JJ</div>
            <div>
                <div className="p-name">Joram Jackson</div>
                <div className="p-role">Corporate Member · Institution of Engineers Tanzania</div>
                <div className="p-chips">
                    <span className="p-chip red">Civil Engineering</span>
                    <span className="p-chip red">Chartered Engineer</span>
                    <span className="p-chip">IET/2019/4872</span>
                    <span className="p-chip">Dar es Salaam</span>
                </div>
            </div>
            <div style={{ marginLeft: "auto" }}><button className="btn btn-outline btn-sm">Change Photo</button></div>
        </div>
        <div className="prof-grid">
            <div className="card">
                <div className="card-head"><span className="card-title">Personal Information</span></div>
                <div className="card-body">
                    <div className="form-row"><div className="form-group"><label className="form-label">First Name</label><input className="form-input" defaultValue="Joram" /></div><div className="form-group"><label className="form-label">Last Name</label><input className="form-input" defaultValue="Jackson" /></div></div>
                    <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" defaultValue="j.jackson@example.co.tz" /></div>
                    <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" defaultValue="+255 712 345 678" /></div>
                    <div className="form-row"><div className="form-group"><label className="form-label">City</label><input className="form-input" defaultValue="Dar es Salaam" /></div><div className="form-group"><label className="form-label">Region</label><input className="form-input" defaultValue="Kinondoni" /></div></div>
                    <div className="form-group"><label className="form-label">Current Employer</label><input className="form-input" defaultValue="Tanzania Roads Agency (TANROADS)" /></div>
                    <div className="form-group"><label className="form-label">Specialisation</label><input className="form-input" defaultValue="Structural & Geotechnical Engineering" /></div>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="card">
                    <div className="card-head"><span className="card-title">Membership Status</span></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table>
                            <tbody>
                                <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Grade</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>Corporate Member</td></tr>
                                <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Member No.</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>IET/2019/4872</td></tr>
                                <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Division</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>Civil Engineering</td></tr>
                                <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Status</td><td style={{ padding: "10px 15px" }}><span className="badge b-green">Active</span></td></tr>
                                <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Expires</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>Dec 31, 2025</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card">
                    <div className="card-head"><span className="card-title">Documents</span></div>
                    <div className="card-body">
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {profileDocumentItems.map((item) => (
                                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: 12 }}>📄 {item.label}</span>
                                    <span className="card-action">{item.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)

export const DashboardEventsPage = () => {
    const [query, setQuery] = useState("")
    const [type, setType] = useState("")
    const [location, setLocation] = useState("")
    const [cost, setCost] = useState("")
    const [view, setView] = useState<"list" | "grid">("list")
    const [selectedEvent, setSelectedEvent] = useState<PortalEventCard | null>(null)
    const [drawerVisible, setDrawerVisible] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)

    const today = new Date().toISOString().slice(0, 10)
    const { data, isLoading, isError } = useEvents({
        limit: 100,
        fromDate: today,
        category: type || undefined,
        location: location || undefined,
        search: query || undefined,
    })

    const events = useMemo(() => (data?.data ?? []).map(mapDashboardEventToCard), [data])
    const filteredEvents = useMemo(
        () => events.filter((event) => {
            const matchesCost = !cost || (cost === "free" ? event.free : !event.free)
            return matchesCost
        }),
        [cost, events],
    )

    const openDrawer = (event: PortalEventCard) => {
        setSelectedEvent(event)
        setDrawerVisible(true)
        requestAnimationFrame(() => setDrawerOpen(true))
    }

    const closeDrawer = () => {
        setDrawerOpen(false)
        setTimeout(() => {
            setDrawerVisible(false)
            setSelectedEvent(null)
        }, 280)
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--iet-red-dark)" }}>Events &amp; Training</h3>
                    <p style={{ fontSize: 11.5, color: "var(--iet-muted)", marginTop: 2 }}>Upcoming IET conferences, workshops and CPD programmes</p>
                </div>
                <button className="btn btn-red btn-sm">My Registrations</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div className="ev-search-box" style={{ display: "flex", alignItems: "center", gap: 7, background: "white", border: "1px solid var(--iet-border)", borderRadius: 8, padding: "6px 11px", width: 200, flexShrink: 0 }}>
                    <SearchIcon width="12" height="12" stroke="var(--iet-muted)" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" style={{ border: "none", background: "transparent", outline: "none", fontFamily: "Montserrat,sans-serif", fontSize: 12, color: "var(--iet-text)", width: "100%" }} />
                </div>

                <div style={{ position: "relative" }}>
                    <select value={type} onChange={(e) => setType(e.target.value)} style={{ appearance: "none", background: "white", border: "1px solid var(--iet-border)", borderRadius: 8, padding: "6px 26px 6px 11px", fontFamily: "Montserrat,sans-serif", fontSize: 12, color: "var(--iet-text)", cursor: "pointer", outline: "none" }}>
                        {EVENT_TYPE_FILTERS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDownIcon width="10" height="10" stroke="var(--iet-muted)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>

                <div style={{ position: "relative" }}>
                    <select value={location} onChange={(e) => setLocation(e.target.value)} style={{ appearance: "none", background: "white", border: "1px solid var(--iet-border)", borderRadius: 8, padding: "6px 26px 6px 11px", fontFamily: "Montserrat,sans-serif", fontSize: 12, color: "var(--iet-text)", cursor: "pointer", outline: "none" }}>
                        <option value="">All Locations</option>
                        <option value="Dar es Salaam">Dar es Salaam</option>
                        <option value="Arusha">Arusha</option>
                        <option value="Dodoma">Dodoma</option>
                        <option value="Online">Online</option>
                    </select>
                    <ChevronDownIcon width="10" height="10" stroke="var(--iet-muted)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>

                <div style={{ position: "relative" }}>
                    <select value={cost} onChange={(e) => setCost(e.target.value)} style={{ appearance: "none", background: "white", border: "1px solid var(--iet-border)", borderRadius: 8, padding: "6px 26px 6px 11px", fontFamily: "Montserrat,sans-serif", fontSize: 12, color: "var(--iet-text)", cursor: "pointer", outline: "none" }}>
                        <option value="">All Costs</option>
                        <option value="free">Free</option>
                        <option value="paid">Paid</option>
                    </select>
                    <ChevronDownIcon width="10" height="10" stroke="var(--iet-muted)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>

                <button className="btn btn-outline btn-sm" onClick={() => { setQuery(""); setType(""); setLocation(""); setCost("") }}>Clear</button>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", gap: 2, background: "var(--iet-bg)", border: "1px solid var(--iet-border)", borderRadius: 7, padding: 3, flexShrink: 0 }}>
                    <button onClick={() => setView("list")} style={{ width: 28, height: 26, border: "none", borderRadius: 5, background: view === "list" ? "white" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: view === "list" ? "var(--iet-red-dark)" : "var(--iet-muted)", boxShadow: view === "list" ? "0 1px 3px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}><ListIcon width="13" height="13" /></button>
                    <button onClick={() => setView("grid")} style={{ width: 28, height: 26, border: "none", borderRadius: 5, background: view === "grid" ? "white" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: view === "grid" ? "var(--iet-red-dark)" : "var(--iet-muted)", boxShadow: view === "grid" ? "0 1px 3px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}><GridIcon width="13" height="13" /></button>
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--iet-muted)" }}>Loading events...</div>
            ) : isError ? (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--iet-red-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                        <SearchIcon width="22" height="22" stroke="var(--iet-red)" strokeWidth="1.8" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--iet-red-dark)", marginBottom: 5 }}>Unable to load events</div>
                    <div style={{ fontSize: 12, color: "var(--iet-muted)" }}>Refresh the page or try again later.</div>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--iet-red-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                        <SearchIcon width="22" height="22" stroke="var(--iet-red)" strokeWidth="1.8" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--iet-red-dark)", marginBottom: 5 }}>No events found</div>
                    <div style={{ fontSize: 12, color: "var(--iet-muted)" }}>Try adjusting your search or filters.</div>
                </div>
            ) : view === "list" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filteredEvents.map((event) => {
                        const [month, dayComma] = event.date.split(" ")
                        const day = (dayComma || "").replace(",", "")
                        return (
                            <div
                                key={event.id}
                                style={{ background: "white", border: "1px solid var(--iet-border)", borderRadius: 10, display: "flex", alignItems: "center", padding: "14px 18px", gap: 18, transition: "border-color .15s,box-shadow .15s" }}
                                onMouseOver={(ev) => { ev.currentTarget.style.borderColor = "var(--iet-red)"; ev.currentTarget.style.boxShadow = "0 2px 10px rgba(226,12,10,.07)" }}
                                onMouseOut={(ev) => { ev.currentTarget.style.borderColor = "var(--iet-border)"; ev.currentTarget.style.boxShadow = "" }}
                            >
                                <div style={{ textAlign: "center", minWidth: 38, flexShrink: 0 }}>
                                    <div style={{ fontFamily: "'Source Serif 4',serif", fontSize: 20, fontWeight: 700, color: "var(--iet-red-dark)", lineHeight: 1 }}>{day}</div>
                                    <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--iet-muted)", marginTop: 2 }}>{month}</div>
                                </div>
                                <div style={{ width: 1, height: 34, background: "var(--iet-border)", flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--iet-text)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.title}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <span style={{ fontSize: 11, color: "var(--iet-muted)" }}>{event.type}</span>
                                        <span style={{ fontSize: 11, color: "var(--iet-muted)" }}>· {event.mode === "Online" ? "Online" : event.location}</span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                                    {event.free ? (
                                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1a6b3c" }}>Free</span>
                                    ) : (
                                        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--iet-muted)" }}>TZS {event.price.toLocaleString()}</span>
                                    )}
                                    <button onClick={() => openDrawer(event)} className="btn btn-outline btn-sm">View Details</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                    {filteredEvents.map((event) => {
                        const parts = event.date.split(" ")
                        const month = parts[0]
                        const day = (parts[1] || "").replace(",", "")
                        const year = parts[2] || ""
                        return (
                            <div
                                key={event.id}
                                style={{ background: "white", border: "1px solid var(--iet-border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", transition: "box-shadow .18s,transform .18s" }}
                                onMouseOver={(ev) => { ev.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.08)"; ev.currentTarget.style.transform = "translateY(-2px)" }}
                                onMouseOut={(ev) => { ev.currentTarget.style.boxShadow = ""; ev.currentTarget.style.transform = "" }}
                            >
                                <div style={{ background: "var(--iet-red-pale)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--iet-border)" }}>
                                    <div style={{ textAlign: "center", minWidth: 34 }}>
                                        <div style={{ fontFamily: "'Source Serif 4',serif", fontSize: 18, fontWeight: 700, color: "var(--iet-red-dark)", lineHeight: 1 }}>{day}</div>
                                        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--iet-muted)", marginTop: 1 }}>{month} {year}</div>
                                    </div>
                                    <div style={{ width: 1, height: 28, background: "var(--iet-border)", flexShrink: 0 }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--iet-red)" }}>{event.type}</span>
                                </div>
                                <div style={{ padding: "14px 16px", flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--iet-text)", lineHeight: 1.4, marginBottom: 6 }}>{event.title}</div>
                                    <div style={{ fontSize: 11, color: "var(--iet-muted)", marginBottom: 10 }}>{event.mode === "Online" ? "💻 Online" : "📍 " + event.location}</div>
                                    <div className="ev-desc-clamp">{event.desc}</div>
                                </div>
                                <div style={{ padding: "11px 16px", borderTop: "1px solid var(--iet-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    {event.free ? (
                                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1a6b3c" }}>Free</span>
                                    ) : (
                                        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--iet-muted)" }}>TZS {event.price.toLocaleString()}</span>
                                    )}
                                    <button onClick={() => openDrawer(event)} className="btn btn-outline btn-sm">View Details</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {drawerVisible && selectedEvent && (
                <>
                    <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(28,16,16,.35)", zIndex: 500, backdropFilter: "blur(2px)" }} />
                    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "96vw", background: "white", zIndex: 501, boxShadow: "-8px 0 40px rgba(0,0,0,.15)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "transform .28s cubic-bezier(.4,0,.2,1)", transform: drawerOpen ? "translateX(0)" : "translateX(100%)" }}>
                        <div style={{ height: 54, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", borderBottom: "1px solid var(--iet-border)", flexShrink: 0 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--iet-red-pale)", display: "flex", alignItems: "center", justifyContent: "center" }}><CalendarIcon width="15" height="15" stroke="var(--iet-red)" /></div>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--iet-text)" }}>{selectedEvent.type} Details</span>
                            <button onClick={closeDrawer} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: "50%", border: "1.5px solid var(--iet-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--iet-muted)", background: "white", transition: "all .15s" }}><CloseIcon width="13" height="13" /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 24px" }}>
                            <div style={{ width: "100%", height: 200, background: selectedEvent.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <CalendarIcon width="64" height="64" stroke="rgba(255,255,255,.2)" strokeWidth="1.5" />
                            </div>
                            <div style={{ padding: "22px 22px 0" }}>
                                <div style={{ fontFamily: "'Source Serif 4',serif", fontSize: 18, fontWeight: 700, color: "var(--iet-text)", marginBottom: 18, lineHeight: 1.35 }}>{selectedEvent.title}</div>
                                <div className="ev-dr"><span className="ev-dl">Event Type</span><span className="ev-dv">{selectedEvent.mode === "Online" ? "Online / Virtual" : "Physical"}</span></div>
                                {selectedEvent.guest && <div className="ev-dr"><span className="ev-dl">Guest of Honour</span><span className="ev-dv">{selectedEvent.guest}</span></div>}
                                {selectedEvent.speaker && <div className="ev-dr"><span className="ev-dl">Speaker</span><span className="ev-dv">{selectedEvent.speaker}</span></div>}
                                <div className="ev-dr"><span className="ev-dl">Region</span><span className="ev-dv">{selectedEvent.region}</span></div>
                                <div className="ev-dr"><span className="ev-dl">Venue</span><span className="ev-dv">{selectedEvent.venue}</span></div>
                                <div className="ev-dr"><span className="ev-dl">Schedule</span><span className="ev-dv">{selectedEvent.start}</span></div>
                                {selectedEvent.end && <div className="ev-dr"><span className="ev-dl">Ends</span><span className="ev-dv">{selectedEvent.end}</span></div>}
                                <div className="ev-dr"><span className="ev-dl">Cost</span><span className="ev-dv">{selectedEvent.free ? "Free (Members)" : "TZS " + selectedEvent.price.toLocaleString()}</span></div>
                                <div className="ev-dr"><span className="ev-dl">Capacity</span><span className="ev-dv">{selectedEvent.availableSlots ? `${selectedEvent.registeredCount ?? 0} / ${selectedEvent.availableSlots}` : "Unlimited"}</span></div>
                                <div className="ev-dr" style={{ alignItems: "flex-start" }}><span className="ev-dl">Description</span><span className="ev-dv" style={{ lineHeight: 1.6 }}>{selectedEvent.desc}</span></div>
                                {selectedEvent.highlights.length > 0 && (
                                    <div className="ev-dr" style={{ alignItems: "flex-start" }}>
                                        <span className="ev-dl">Key Highlights</span>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                            {selectedEvent.highlights.map((highlight) => (
                                                <span key={highlight} style={{ background: "var(--iet-red-pale)", border: "1px solid var(--iet-border)", borderRadius: 20, padding: "4px 11px", fontSize: 11, color: "var(--iet-red-dark)", fontWeight: 500 }}>{highlight}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--iet-border)", display: "flex", gap: 10, flexShrink: 0 }}>
                            <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={closeDrawer}>Cancel</button>
                            <button className="btn btn-red" style={{ flex: 1, justifyContent: "center" }}>Register</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
