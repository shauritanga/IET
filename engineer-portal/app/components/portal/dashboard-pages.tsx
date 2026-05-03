import type { CSSProperties, ReactNode } from "react"
import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Link } from "react-router"
import { BookIcon, CalendarIcon, CheckIcon, ChevronDownIcon, ClockIcon, CloseIcon, DollarIcon, FileIcon, GridIcon, ListIcon, PaymentIcon, SearchIcon, StarIcon, UserIcon, UsersIcon } from "~/components/portal/icons"
import { membershipBenefits, profileDocumentItems, type KpiItem } from "~/components/portal/mock-data"
import { useUpcomingEvents } from "~/routes/dashboard/home/repositories/useUpcomingEvents"
import { useEvents } from "~/routes/dashboard/events/repositories/use-events"
import { mapDashboardEventToCard, type PortalEventCard } from "~/routes/dashboard/events/utils"
import { useGetUserProfile } from "~/routes/dashboard/profile/repositories/handle-get-user-profile"
import { useMembershipFeeHistory } from "~/routes/dashboard/home/repositories/useMembershipFeeHistory"
import http from "~/utils/http"

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

type EventPaymentMethod = "AIRTEL_MONEY" | "TIGO_PESA" | "HALOPESA" | "MPESA" | "SELCOM"

const EVENT_PAYMENT_METHOD_LABELS: Record<EventPaymentMethod, string> = {
    TIGO_PESA: "Mixx by Yas",
    HALOPESA: "Halopesa",
    AIRTEL_MONEY: "Airtel Money",
    MPESA: "M-Pesa",
    SELCOM: "Card Payment",
}

const EVENT_MOBILE_PAYMENT_METHODS: EventPaymentMethod[] = ["TIGO_PESA", "HALOPESA", "AIRTEL_MONEY", "MPESA"]

const normalizePaymentPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")

    if (digits.startsWith("255") && digits.length === 12) {
        return digits
    }

    if (digits.startsWith("0") && digits.length === 10) {
        return `255${digits.slice(1)}`
    }

    if (digits.length === 9) {
        return `255${digits}`
    }

    return digits
}

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
    const { data: profileData } = useGetUserProfile()
    const { data: feesData } = useMembershipFeeHistory()
    const profile = profileData?.data

    const upcomingEvents = useMemo(
        () => (data?.data ?? []).map(mapDashboardEventToCard),
        [data],
    )

    const memberSinceYear = profile?.joiningDate
        ? new Date(profile.joiningDate).getFullYear()
        : null

    const yearsActive = memberSinceYear ? new Date().getFullYear() - memberSinceYear : null

    const outstandingFees = useMemo(() => {
        const fees = feesData?.data ?? []
        return fees
            .filter((f) => f.status === "PENDING" || f.status === "OVERDUE")
            .reduce((sum, f) => sum + f.amount, 0)
    }, [feesData])

    return (
        <div>
            <div className="kpi-grid">
                <div className="kpi">
                    <div className="kpi-icon"><StarIcon width="17" height="17" /></div>
                    <div className="kpi-val">{memberSinceYear ?? "—"}</div>
                    <div className="kpi-lbl">Member Since</div>
                    <div className="kpi-note ok">{yearsActive != null ? `✓ ${yearsActive} year${yearsActive !== 1 ? "s" : ""} active` : ""}</div>
                </div>
                <div className="kpi">
                    <div className="kpi-icon"><ClockIcon width="17" height="17" /></div>
                    <div className="kpi-val">—</div>
                    <div className="kpi-lbl">CPD Hours (2024)</div>
                    <div className="kpi-note">Coming soon</div>
                </div>
                <div className="kpi">
                    <div className="kpi-icon"><CalendarIcon width="17" height="17" /></div>
                    <div className="kpi-val">—</div>
                    <div className="kpi-lbl">Events Attended</div>
                    <div className="kpi-note">Coming soon</div>
                </div>
                <div className="kpi">
                    <div className="kpi-icon"><PaymentIcon width="17" height="17" /></div>
                    <div className="kpi-val" style={{ fontSize: 20 }}>TZS {outstandingFees.toLocaleString()}</div>
                    <div className="kpi-lbl">Outstanding Balance</div>
                    <div className="kpi-note ok">{outstandingFees === 0 ? "✓ All dues cleared" : "⚠ Payment pending"}</div>
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

const FEE_STATUS_CLASS: Record<string, string> = {
    PAID: "b-green",
    PENDING: "b-yellow",
    OVERDUE: "b-red",
    EXPIRING: "b-yellow",
}

export const DashboardPaymentPage = () => {
    const { data: profileData } = useGetUserProfile()
    const { data: feesData, isLoading: feesLoading } = useMembershipFeeHistory()
    const profile = profileData?.data
    const fees = feesData?.data ?? []

    const currentYear = new Date().getFullYear()
    const totalPaidThisYear = fees
        .filter((f) => f.status === "PAID" && f.paidAt && new Date(f.paidAt).getFullYear() === currentYear)
        .reduce((sum, f) => sum + f.amount, 0)

    const outstanding = fees
        .filter((f) => f.status === "PENDING" || f.status === "OVERDUE")
        .reduce((sum, f) => sum + f.amount, 0)

    const nextDue = fees.find((f) => f.status === "PENDING" || f.status === "OVERDUE")
    const nextDueLabel = nextDue?.dueDate
        ? new Date(nextDue.dueDate).toLocaleDateString("en-TZ", { month: "long", year: "numeric" })
        : "—"

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--iet-red-dark)" }}>Payments</h3>
                    <p style={{ fontSize: 11.5, color: "var(--iet-muted)", marginTop: 2 }}>Manage your subscription and transaction history</p>
                </div>
            </div>

            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                <div className="kpi">
                    <div className="kpi-icon"><PaymentIcon width="17" height="17" /></div>
                    <div className="kpi-val">{totalPaidThisYear.toLocaleString()}</div>
                    <div className="kpi-lbl">Total Paid ({currentYear}) · TZS</div>
                    <div className="kpi-note ok">✓ Annual Subscription</div>
                </div>
                <div className="kpi">
                    <div className="kpi-icon" style={{ background: "#E8F5E9", color: "#1a6b3c" }}><CheckIcon width="17" height="17" /></div>
                    <div className="kpi-val" style={{ color: outstanding > 0 ? "var(--iet-red)" : "#1a6b3c" }}>{outstanding.toLocaleString()}</div>
                    <div className="kpi-lbl">Outstanding Balance · TZS</div>
                    <div className="kpi-note ok">{outstanding === 0 ? "✓ Fully settled" : "⚠ Payment pending"}</div>
                </div>
                <div className="kpi">
                    <div className="kpi-icon"><CalendarIcon width="17" height="17" /></div>
                    <div className="kpi-val" style={{ fontSize: 18 }}>{nextDueLabel}</div>
                    <div className="kpi-lbl">Next Due Date</div>
                    <div className="kpi-note">Annual renewal reminder</div>
                </div>
            </div>

            <div className="card">
                <div className="card-head"><span className="card-title">Fee History</span></div>
                {feesLoading ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: "var(--iet-muted)" }}>Loading...</div>
                ) : fees.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: "var(--iet-muted)" }}>No fee records found.</div>
                ) : (
                    <table>
                        <thead><tr><th>Year</th><th>Class</th><th>Amount (TZS)</th><th>Due Date</th><th>Paid At</th><th>Status</th></tr></thead>
                        <tbody>
                            {fees.map((fee, i) => (
                                <tr key={fee.id ?? i}>
                                    <td><strong>{fee.year}</strong></td>
                                    <td>{fee.membershipClass}</td>
                                    <td>{fee.amount.toLocaleString()}</td>
                                    <td>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString("en-TZ") : "—"}</td>
                                    <td>{fee.paidAt ? new Date(fee.paidAt).toLocaleDateString("en-TZ") : "—"}</td>
                                    <td><span className={`badge ${FEE_STATUS_CLASS[fee.status] ?? ""}`}>{fee.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

const BenefitsGrid = () => (
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
)

const StatusBanner = ({ tone, children }: { tone: "info" | "warning" | "success"; children: ReactNode }) => {
    const colors: Record<string, { bg: string; border: string; color: string }> = {
        info:    { bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8" },
        warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" },
        success: { bg: "#F0FDF4", border: "#BBF7D0", color: "#166534" },
    }
    const c = colors[tone]
    return (
        <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 18, fontSize: 12.5, color: c.color, lineHeight: 1.6 }}>
            {children}
        </div>
    )
}

export const DashboardMembershipPage = ({ onApplyForMembership }: { onApplyForMembership?: () => void }) => {
    const { data: profileData, isPending } = useGetUserProfile()
    const profile = profileData?.data
    const regStatus = profile?.registrationStatus ?? null
    const membershipStatus = (profile?.membershipStatus ?? "").toUpperCase()
    const isActive = membershipStatus === "ACTIVE"
    const isInReview = ["IN_REVIEW", "SUBMITTED", "PENDING_REVIEW"].includes((regStatus ?? "").toUpperCase())
    const isChangesRequested = (regStatus ?? "").toUpperCase() === "CHANGES_REQUESTED"
    const isApproved = (regStatus ?? "").toUpperCase() === "APPROVED" && !isActive

    const formatDate = (d?: string | null) =>
        d ? new Date(d).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" }) : "—"

    if (isPending) {
        return (
            <div>
                <PageHeader title="Membership" subtitle="Your IET Tanzania membership details and benefits" />
                <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 12, color: "var(--iet-muted)" }}>Loading…</div>
            </div>
        )
    }

    // State E — Active member
    if (isActive) {
        return (
            <div>
                <PageHeader title="My Membership" subtitle="Your IET Tanzania membership details and benefits" />
                <div className="card" style={{ marginBottom: 18 }}>
                    <div className="card-head"><span className="card-title">Membership Details</span><span className="badge b-green">Active</span></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table><tbody>
                            <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Grade</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{profile?.membershipClass ?? "—"}</td></tr>
                            <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Member No.</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{profile?.membershipId ?? "—"}</td></tr>
                            <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Discipline</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{profile?.engineeringDiscipline ?? "—"}</td></tr>
                            <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Joined</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{formatDate(profile?.joiningDate)}</td></tr>
                            <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Expires</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{formatDate(profile?.membershipExpiryDate)}</td></tr>
                            <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Annual Fee</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{profile?.annualMembershipFee ? `TZS ${Number(profile.annualMembershipFee).toLocaleString()}` : "—"}</td></tr>
                            <tr><td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Days Until Expiry</td><td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px", color: (profile?.daysUntilExpiry ?? 999) <= 30 ? "var(--iet-red)" : "#1a6b3c" }}>{profile?.daysUntilExpiry != null ? `${profile.daysUntilExpiry} days` : "—"}</td></tr>
                        </tbody></table>
                    </div>
                </div>
                <BenefitsGrid />
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
    }

    // State B — Application in review
    if (isInReview) {
        return (
            <div>
                <PageHeader title="Membership" subtitle="Your IET Tanzania membership details and benefits" />
                <StatusBanner tone="info">
                    <strong>Application under review</strong> — Your membership application has been submitted and is currently being reviewed by the IET secretariat. You will be notified once a decision is made.
                    <div style={{ marginTop: 10 }}>
                        <Link to="/dashboard/status" style={{ fontWeight: 700, color: "inherit", textDecoration: "underline" }}>View application status →</Link>
                    </div>
                </StatusBanner>
                <BenefitsGrid />
            </div>
        )
    }

    // State C — Changes requested
    if (isChangesRequested) {
        return (
            <div>
                <PageHeader title="Membership" subtitle="Your IET Tanzania membership details and benefits" />
                <StatusBanner tone="warning">
                    <strong>Action required</strong> — The review committee has requested changes to your application. Please review their feedback and update your application to continue.
                    <div style={{ marginTop: 10 }}>
                        <button className="btn btn-outline btn-sm" onClick={onApplyForMembership}>Continue Application →</button>
                    </div>
                </StatusBanner>
                <BenefitsGrid />
            </div>
        )
    }

    // State D — Approved, awaiting activation
    if (isApproved) {
        return (
            <div>
                <PageHeader title="Membership" subtitle="Your IET Tanzania membership details and benefits" />
                <StatusBanner tone="success">
                    <strong>Congratulations! Your application has been approved.</strong> Your membership is being activated. You will receive a confirmation email with your member number and certificate shortly.
                </StatusBanner>
                <BenefitsGrid />
            </div>
        )
    }

    // State A — No application or DRAFT/REJECTED
    return (
        <div>
            <PageHeader
                title="Membership"
                subtitle="Your IET Tanzania membership details and benefits"
                action={<button className="btn btn-red" onClick={onApplyForMembership}>+ Apply for Membership</button>}
            />
            <BenefitsGrid />
        </div>
    )
}

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
    const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set())
    const [drawerVisible, setDrawerVisible] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [paymentStepOpen, setPaymentStepOpen] = useState(false)
    const [eventPaymentMethod, setEventPaymentMethod] = useState<EventPaymentMethod>("TIGO_PESA")
    const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("")

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromDateStr = thirtyDaysAgo.toISOString().slice(0, 10)
    const { data, isLoading, isError, refetch } = useEvents({
        limit: 100,
        fromDate: fromDateStr,
        category: type || undefined,
        location: location || undefined,
        search: query || undefined,
    })
    const registerMutation = useMutation({
        mutationFn: async ({
            event,
            paymentMethod,
            phoneNumber,
        }: {
            event: PortalEventCard
            paymentMethod?: EventPaymentMethod
            phoneNumber?: string
        }) => {
            const response = await http.post(`/events/${event.id}/register`, {
                attendeeType: "MEMBER",
                ...(paymentMethod ? { paymentMethod } : {}),
                ...(phoneNumber ? { phoneNumber } : {}),
            })
            return { event, result: response.data?.data }
        },
        onSuccess: async ({ event }) => {
            toast.success(event.free ? "Registration confirmed." : "Payment recorded and registration confirmed.")
            await refetch()
            setPaymentStepOpen(false)
            setRegisteredEventIds((current) => new Set(current).add(event.id))
            setSelectedEvent((current) => current?.id === event.id
                ? {
                    ...current,
                    isRegistered: true,
                    registeredCount: (current.registeredCount ?? 0) + 1,
                    isFull: current.availableSlots ? (current.registeredCount ?? 0) + 1 >= current.availableSlots : current.isFull,
                }
                : current,
            )
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message ?? "Failed to register for this event.")
        },
    })

    const events = useMemo(
        () => (data?.data ?? []).map((event) => {
            const card = mapDashboardEventToCard(event)
            return registeredEventIds.has(card.id) ? { ...card, isRegistered: true } : card
        }),
        [data, registeredEventIds],
    )
    const filteredEvents = useMemo(
        () => events.filter((event) => {
            const matchesCost = !cost || (cost === "free" ? event.free : !event.free)
            return matchesCost
        }),
        [cost, events],
    )

    const openDrawer = (event: PortalEventCard) => {
        setSelectedEvent(event)
        setPaymentStepOpen(false)
        setEventPaymentMethod("TIGO_PESA")
        setPaymentPhoneNumber("")
        setDrawerVisible(true)
        requestAnimationFrame(() => setDrawerOpen(true))
    }

    const closeDrawer = () => {
        setDrawerOpen(false)
        setTimeout(() => {
            setDrawerVisible(false)
            setSelectedEvent(null)
            setPaymentStepOpen(false)
            setEventPaymentMethod("TIGO_PESA")
            setPaymentPhoneNumber("")
        }, 280)
    }

    const registerForSelectedEvent = () => {
        if (!selectedEvent || selectedEvent.isRegistered || selectedEvent.isFull || registerMutation.isPending) return

        if (!selectedEvent.free) {
            setPaymentStepOpen(true)
            return
        }

        registerMutation.mutate({ event: selectedEvent })
    }

    const completePaidEventRegistration = () => {
        if (!selectedEvent || selectedEvent.isRegistered || selectedEvent.isFull || registerMutation.isPending) return

        const normalizedPhoneNumber = normalizePaymentPhoneNumber(paymentPhoneNumber)

        if (EVENT_MOBILE_PAYMENT_METHODS.includes(eventPaymentMethod) && !paymentPhoneNumber.trim()) {
            toast.error("Phone number is required for mobile money payments.")
            return
        }

        if (EVENT_MOBILE_PAYMENT_METHODS.includes(eventPaymentMethod) && !/^255\d{9}$/.test(normalizedPhoneNumber)) {
            toast.error("Use phone number format 255XXXXXXXXX.")
            return
        }

        registerMutation.mutate({
            event: selectedEvent,
            paymentMethod: eventPaymentMethod,
            phoneNumber: EVENT_MOBILE_PAYMENT_METHODS.includes(eventPaymentMethod) ? normalizedPhoneNumber : undefined,
        })
    }

    const registrationButtonLabel = selectedEvent?.isRegistered
        ? "Already Registered"
        : selectedEvent?.isFull
            ? "Event Full"
            : registerMutation.isPending && registerMutation.variables?.event.id === selectedEvent?.id
                ? paymentStepOpen ? "Processing..." : "Registering..."
                : paymentStepOpen
                    ? "Complete Registration"
                    : "Register"

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
                <div className="ev-search-box" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--iet-white)", border: "1px solid var(--iet-border)", borderRadius: 8, padding: "6px 11px", width: 200, flexShrink: 0 }}>
                    <SearchIcon width="12" height="12" stroke="var(--iet-muted)" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" style={{ border: "none", background: "transparent", outline: "none", fontFamily: "Montserrat,sans-serif", fontSize: 12, color: "var(--iet-text)", width: "100%" }} />
                </div>

                <div style={{ position: "relative" }}>
                    <select value={type} onChange={(e) => setType(e.target.value)} style={{ appearance: "none", background: "var(--iet-white)", border: "1px solid var(--iet-border)", borderRadius: 8, padding: "6px 26px 6px 11px", fontFamily: "Montserrat,sans-serif", fontSize: 12, color: "var(--iet-text)", cursor: "pointer", outline: "none" }}>
                        {EVENT_TYPE_FILTERS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDownIcon width="10" height="10" stroke="var(--iet-muted)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>

                <div style={{ position: "relative" }}>
                    <select value={location} onChange={(e) => setLocation(e.target.value)} style={{ appearance: "none", background: "var(--iet-white)", border: "1px solid var(--iet-border)", borderRadius: 8, padding: "6px 26px 6px 11px", fontFamily: "Montserrat,sans-serif", fontSize: 12, color: "var(--iet-text)", cursor: "pointer", outline: "none" }}>
                        <option value="">All Locations</option>
                        <option value="Dar es Salaam">Dar es Salaam</option>
                        <option value="Arusha">Arusha</option>
                        <option value="Dodoma">Dodoma</option>
                        <option value="Online">Online</option>
                    </select>
                    <ChevronDownIcon width="10" height="10" stroke="var(--iet-muted)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>

                <div style={{ position: "relative" }}>
                    <select value={cost} onChange={(e) => setCost(e.target.value)} style={{ appearance: "none", background: "var(--iet-white)", border: "1px solid var(--iet-border)", borderRadius: 8, padding: "6px 26px 6px 11px", fontFamily: "Montserrat,sans-serif", fontSize: 12, color: "var(--iet-text)", cursor: "pointer", outline: "none" }}>
                        <option value="">All Costs</option>
                        <option value="free">Free</option>
                        <option value="paid">Paid</option>
                    </select>
                    <ChevronDownIcon width="10" height="10" stroke="var(--iet-muted)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>

                <button className="btn btn-outline btn-sm" onClick={() => { setQuery(""); setType(""); setLocation(""); setCost("") }}>Clear</button>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", gap: 2, background: "var(--iet-bg)", border: "1px solid var(--iet-border)", borderRadius: 7, padding: 3, flexShrink: 0 }}>
                    <button onClick={() => setView("list")} style={{ width: 28, height: 26, border: "none", borderRadius: 5, background: view === "list" ? "var(--iet-white)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: view === "list" ? "var(--iet-red-dark)" : "var(--iet-muted)", boxShadow: view === "list" ? "0 1px 3px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}><ListIcon width="13" height="13" /></button>
                    <button onClick={() => setView("grid")} style={{ width: 28, height: 26, border: "none", borderRadius: 5, background: view === "grid" ? "var(--iet-white)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: view === "grid" ? "var(--iet-red-dark)" : "var(--iet-muted)", boxShadow: view === "grid" ? "0 1px 3px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}><GridIcon width="13" height="13" /></button>
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
                                style={{ background: "var(--iet-white)", border: "1px solid var(--iet-border)", borderRadius: 10, display: "flex", alignItems: "center", padding: "14px 18px", gap: 18, transition: "border-color .15s,box-shadow .15s" }}
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
                                style={{ background: "var(--iet-white)", border: "1px solid var(--iet-border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", transition: "box-shadow .18s,transform .18s" }}
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
                    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "96vw", background: "var(--iet-white)", zIndex: 501, boxShadow: "-8px 0 40px rgba(0,0,0,.15)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "transform .28s cubic-bezier(.4,0,.2,1)", transform: drawerOpen ? "translateX(0)" : "translateX(100%)" }}>
                        <div style={{ height: 54, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", borderBottom: "1px solid var(--iet-border)", flexShrink: 0 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--iet-red-pale)", display: "flex", alignItems: "center", justifyContent: "center" }}><CalendarIcon width="15" height="15" stroke="var(--iet-red)" /></div>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--iet-text)" }}>{selectedEvent.type} Details</span>
                            <button onClick={closeDrawer} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: "50%", border: "1.5px solid var(--iet-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--iet-muted)", background: "var(--iet-white)", transition: "all .15s" }}><CloseIcon width="13" height="13" /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 24px" }}>
                            <div style={{ width: "100%", height: 200, background: selectedEvent.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                                {selectedEvent.coverImage
                                    ? <img src={selectedEvent.coverImage} alt={selectedEvent.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <CalendarIcon width="64" height="64" stroke="rgba(255,255,255,.2)" strokeWidth="1.5" />
                                }
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
                                {paymentStepOpen && !selectedEvent.free && (
                                    <div style={{ marginTop: 20, border: "1px solid var(--iet-border)", borderRadius: 10, overflow: "hidden", background: "var(--iet-white)" }}>
                                        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--iet-border)", background: "var(--iet-bg)" }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--iet-red-dark)" }}>Payment Method</div>
                                            <div style={{ fontSize: 11.5, color: "var(--iet-muted)", marginTop: 3 }}>Choose how you want to complete this registration.</div>
                                        </div>
                                        <div style={{ padding: 16 }}>
                                            <div style={{ display: "grid", gap: 8 }}>
                                                {EVENT_MOBILE_PAYMENT_METHODS.map((method) => (
                                                    <button
                                                        key={method}
                                                        type="button"
                                                        onClick={() => setEventPaymentMethod(method)}
                                                        style={{
                                                            width: "100%",
                                                            border: `1.5px solid ${eventPaymentMethod === method ? "var(--iet-red)" : "var(--iet-border)"}`,
                                                            borderRadius: 8,
                                                            background: eventPaymentMethod === method ? "var(--iet-red-pale)" : "var(--iet-bg)",
                                                            padding: "11px 12px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            cursor: "pointer",
                                                            fontFamily: "Montserrat,sans-serif",
                                                            color: "var(--iet-text)",
                                                        }}
                                                    >
                                                        <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, fontWeight: 700 }}>
                                                            <span style={{
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: "50%",
                                                                border: `1.5px solid ${eventPaymentMethod === method ? "var(--iet-red)" : "var(--iet-muted)"}`,
                                                                background: eventPaymentMethod === method ? "var(--iet-red)" : "transparent",
                                                                flexShrink: 0,
                                                            }} />
                                                            {EVENT_PAYMENT_METHOD_LABELS[method]}
                                                        </span>
                                                        <span style={{ fontSize: 10.5, color: "var(--iet-muted)", fontWeight: 600 }}>Mobile money</span>
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setEventPaymentMethod("SELCOM")}
                                                    style={{
                                                        width: "100%",
                                                        border: `1.5px solid ${eventPaymentMethod === "SELCOM" ? "var(--iet-red)" : "var(--iet-border)"}`,
                                                        borderRadius: 8,
                                                        background: eventPaymentMethod === "SELCOM" ? "var(--iet-red-pale)" : "var(--iet-bg)",
                                                        padding: "11px 12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        cursor: "pointer",
                                                        fontFamily: "Montserrat,sans-serif",
                                                        color: "var(--iet-text)",
                                                    }}
                                                >
                                                    <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, fontWeight: 700 }}>
                                                        <span style={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: "50%",
                                                            border: `1.5px solid ${eventPaymentMethod === "SELCOM" ? "var(--iet-red)" : "var(--iet-muted)"}`,
                                                            background: eventPaymentMethod === "SELCOM" ? "var(--iet-red)" : "transparent",
                                                            flexShrink: 0,
                                                        }} />
                                                        Card Payment
                                                    </span>
                                                    <span style={{ fontSize: 10.5, color: "var(--iet-muted)", fontWeight: 600 }}>Secure checkout</span>
                                                </button>
                                            </div>

                                            <div style={{ marginTop: 14, border: "1px solid var(--iet-border)", borderRadius: 8, padding: 12, background: "var(--iet-bg)" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 12 }}>
                                                    <span style={{ color: "var(--iet-muted)" }}>{selectedEvent.title}</span>
                                                    <span style={{ color: "var(--iet-red-dark)", fontWeight: 800, whiteSpace: "nowrap" }}>TZS {selectedEvent.price.toLocaleString()}</span>
                                                </div>
                                                <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--iet-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 12.5, fontWeight: 800, color: "var(--iet-red-dark)" }}>
                                                    <span>Total</span>
                                                    <span>TZS {selectedEvent.price.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {EVENT_MOBILE_PAYMENT_METHODS.includes(eventPaymentMethod) && (
                                                <div style={{ marginTop: 14 }}>
                                                    <label style={{ display: "block", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".7px", color: "var(--iet-muted)", marginBottom: 6 }}>Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        value={paymentPhoneNumber}
                                                        onChange={(event) => setPaymentPhoneNumber(event.target.value)}
                                                        placeholder="e.g. 255712000000"
                                                        style={{
                                                            width: "100%",
                                                            border: "1.5px solid var(--iet-border)",
                                                            borderRadius: 8,
                                                            background: "var(--iet-white)",
                                                            padding: "9px 11px",
                                                            fontSize: 12.5,
                                                            fontFamily: "Montserrat,sans-serif",
                                                            color: "var(--iet-text)",
                                                            outline: "none",
                                                        }}
                                                    />
                                                    <p style={{ fontSize: 11, color: "var(--iet-muted)", marginTop: 6 }}>Use the format 255XXXXXXXXX.</p>
                                                </div>
                                            )}

                                            <div style={{ marginTop: 14, fontSize: 11.5, lineHeight: 1.6, color: "var(--iet-muted)" }}>
                                                {EVENT_MOBILE_PAYMENT_METHODS.includes(eventPaymentMethod)
                                                    ? "A payment prompt will be sent to the selected mobile money number to complete registration."
                                                    : "Continue to complete payment through secure card checkout."}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--iet-border)", display: "flex", gap: 10, flexShrink: 0 }}>
                            <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={closeDrawer}>Cancel</button>
                            <button
                                className="btn btn-red"
                                style={{
                                    flex: 1,
                                    justifyContent: "center",
                                    opacity: selectedEvent.isRegistered || selectedEvent.isFull || registerMutation.isPending ? 0.65 : 1,
                                    cursor: selectedEvent.isRegistered || selectedEvent.isFull || registerMutation.isPending ? "not-allowed" : "pointer",
                                }}
                                disabled={selectedEvent.isRegistered || selectedEvent.isFull || registerMutation.isPending}
                                onClick={paymentStepOpen && !selectedEvent.free ? completePaidEventRegistration : registerForSelectedEvent}
                            >
                                {registrationButtonLabel}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
