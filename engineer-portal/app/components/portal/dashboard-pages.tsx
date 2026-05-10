import type { CSSProperties, ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Link } from "react-router"
import { BookIcon, CalendarIcon, CheckIcon, ChevronDownIcon, ClockIcon, CloseIcon, DollarIcon, FileIcon, GridIcon, ListIcon, PaymentIcon, SearchIcon, StarIcon, UserIcon, UsersIcon } from "~/components/portal/icons"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "~/components/ui/dialog"
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

type DashboardNotification = {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
    actionUrl?: string | null
}

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

const fetchRecentActivity = async () => {
    const response = await http.get<{ data: DashboardNotification[] }>("/notifications", {
        params: { page: 1, limit: 5 },
    })
    return response.data.data ?? []
}

const formatActivityTime = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleDateString("en-TZ", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case "PAYMENT_REMINDER":
        case "MEMBERSHIP_EXPIRY":
            return { Icon: PaymentIcon, bg: "#FADCDC", color: "#E20C0A" }
        case "EVENT_REMINDER":
            return { Icon: CalendarIcon, bg: "#E8F5E9", color: "#1a6b3c" }
        case "APPLICATION_UPDATE":
        case "WELCOME":
        case "EMAIL_VERIFICATION":
            return { Icon: CheckIcon, bg: "#E8F5E9", color: "#1a6b3c" }
        case "APPLICATION_DELAY":
            return { Icon: ClockIcon, bg: "#FFF4E5", color: "#C2410C" }
        default:
            return { Icon: FileIcon, bg: "#FFF8E1", color: "#F57F17" }
    }
}

const isExternalUrl = (value?: string | null) => !!value && /^https?:\/\//i.test(value)


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
    const {
        data: recentActivity = [],
        isLoading: activityLoading,
        isError: activityError,
    } = useQuery({
        queryKey: ["dashboard-recent-activity"],
        queryFn: fetchRecentActivity,
    })
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
                    <div className="card-head"><span className="card-title">Recent Activity</span></div>
                    <div className="card-body">
                        {activityLoading ? (
                            <div className="py-4 text-[11.5px] text-[#7A6060]">Loading recent activity...</div>
                        ) : activityError ? (
                            <div className="py-4 text-[11.5px] text-[#B3261E]">Unable to load recent activity right now.</div>
                        ) : recentActivity.length === 0 ? (
                            <div className="py-4 text-[11.5px] text-[#7A6060]">No recent activity found.</div>
                        ) : (
                            recentActivity.map((activity) => {
                                const { Icon, bg, color } = getActivityIcon(activity.type)
                                const content = (
                                    <div className="activity-row">
                                        <div className="a-icon" style={{ background: bg, color }}>
                                            <Icon width="14" height="14" />
                                        </div>
                                        <div>
                                            <div className="a-text">
                                                <strong>{activity.title}</strong>
                                                {activity.message ? ` — ${activity.message}` : ""}
                                            </div>
                                            <div className="a-time">{formatActivityTime(activity.createdAt)}</div>
                                        </div>
                                    </div>
                                )

                                if (!activity.actionUrl) {
                                    return <div key={activity.id}>{content}</div>
                                }

                                if (isExternalUrl(activity.actionUrl)) {
                                    return (
                                        <a
                                            key={activity.id}
                                            href={activity.actionUrl}
                                            style={{ display: "block", textDecoration: "none" }}
                                        >
                                            {content}
                                        </a>
                                    )
                                }

                                return (
                                    <Link
                                        key={activity.id}
                                        to={activity.actionUrl}
                                        style={{ display: "block", textDecoration: "none" }}
                                    >
                                        {content}
                                    </Link>
                                )
                            })
                        )}
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
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [eventPaymentMethod, setEventPaymentMethod] = useState<EventPaymentMethod>("TIGO_PESA")
    const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("")
    const [cardNumber, setCardNumber] = useState("")
    const [cardHolder, setCardHolder] = useState("")
    const [cardExpiry, setCardExpiry] = useState("")
    const [cardCvv, setCardCvv] = useState("")

    const { data: profileData } = useGetUserProfile()
    const profile = profileData?.data
    const hasMemberDiscount = !!(
        profile?.membershipClass &&
        profile?.membershipStatus === "ACTIVE" &&
        !profile?.isMembershipExpired
    )

    const storageKey = profile?.id ? `iet_event_registrations_${profile.id}` : null

    // Hydrate registeredEventIds from localStorage once the user profile is known
    useEffect(() => {
        if (!storageKey) return
        const stored = localStorage.getItem(storageKey)
        if (!stored) return
        try { setRegisteredEventIds(new Set(JSON.parse(stored))) } catch {}
    }, [storageKey])

    // Persist registeredEventIds to localStorage whenever it changes
    useEffect(() => {
        if (!storageKey) return
        if (registeredEventIds.size === 0) {
            localStorage.removeItem(storageKey)
        } else {
            localStorage.setItem(storageKey, JSON.stringify([...registeredEventIds]))
        }
    }, [registeredEventIds, storageKey])

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

    // Sync registeredEventIds with API — source of truth is always the backend
    useEffect(() => {
        if (!data?.data) return
        const fromApi = new Set(data.data.filter(e => e.isRegistered).map(e => e.id))
        setRegisteredEventIds(prev => {
            // Keep only IDs the API confirms; drop any stale local ones
            const next = new Set([...prev].filter(id => fromApi.has(id)))
            fromApi.forEach(id => next.add(id))
            return next
        })
    }, [data])
    const registerMutation = useMutation({
        mutationFn: async ({
            event,
            paymentMethod,
            phoneNumber,
            cardNumber: cn,
            cardHolder: ch,
            cardExpiry: ce,
            cardCvv: cv,
        }: {
            event: PortalEventCard
            paymentMethod?: EventPaymentMethod
            phoneNumber?: string
            cardNumber?: string
            cardHolder?: string
            cardExpiry?: string
            cardCvv?: string
        }) => {
            const response = await http.post(`/events/${event.id}/register`, {
                attendeeType: "MEMBER",
                ...(paymentMethod ? { paymentMethod } : {}),
                ...(phoneNumber ? { phoneNumber } : {}),
                ...(cn ? { cardNumber: cn } : {}),
                ...(ch ? { cardHolder: ch } : {}),
                ...(ce ? { cardExpiry: ce } : {}),
                ...(cv ? { cardCvv: cv } : {}),
            })
            return { event, result: response.data?.data }
        },
        onSuccess: async ({ event }) => {
            toast.success(event.free ? "Registration confirmed." : "Payment recorded and registration confirmed.")
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
            setPaymentDialogOpen(false)
            await refetch()
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

    const resetPaymentFields = () => {
        setEventPaymentMethod("TIGO_PESA")
        setPaymentPhoneNumber("")
        setCardNumber("")
        setCardHolder("")
        setCardExpiry("")
        setCardCvv("")
    }

    const openDrawer = (event: PortalEventCard) => {
        setSelectedEvent({ ...event, isRegistered: event.isRegistered || registeredEventIds.has(event.id) })
        setPaymentDialogOpen(false)
        resetPaymentFields()
        setDrawerVisible(true)
        requestAnimationFrame(() => setDrawerOpen(true))
    }

    const closeDrawer = () => {
        setDrawerOpen(false)
        setPaymentDialogOpen(false)
        setTimeout(() => {
            setDrawerVisible(false)
            setSelectedEvent(null)
            resetPaymentFields()
        }, 280)
    }

    const registerForSelectedEvent = () => {
        if (!selectedEvent || selectedEvent.isRegistered || selectedEvent.isFull || registerMutation.isPending) return

        if (!selectedEvent.free) {
            setDrawerOpen(false)
            setTimeout(() => {
                setDrawerVisible(false)
                setPaymentDialogOpen(true)
            }, 280)
            return
        }

        registerMutation.mutate({ event: selectedEvent })
    }

    const closePaymentDialog = () => {
        setPaymentDialogOpen(false)
        setSelectedEvent(null)
        resetPaymentFields()
    }

    const completePaidEventRegistration = () => {
        if (!selectedEvent || selectedEvent.isRegistered || selectedEvent.isFull || registerMutation.isPending) return

        if (EVENT_MOBILE_PAYMENT_METHODS.includes(eventPaymentMethod)) {
            const normalizedPhoneNumber = normalizePaymentPhoneNumber(paymentPhoneNumber)
            if (!paymentPhoneNumber.trim()) {
                toast.error("Phone number is required for mobile money payments.")
                return
            }
            if (!/^255\d{9}$/.test(normalizedPhoneNumber)) {
                toast.error("Use phone number format 255XXXXXXXXX.")
                return
            }
            registerMutation.mutate({
                event: selectedEvent,
                paymentMethod: eventPaymentMethod,
                phoneNumber: normalizedPhoneNumber,
            })
            return
        }

        if (eventPaymentMethod === "SELCOM") {
            const rawNumber = cardNumber.replace(/\s/g, "")
            if (!cardHolder.trim()) { toast.error("Cardholder name is required."); return }
            if (rawNumber.length < 16) { toast.error("Enter a valid 16-digit card number."); return }
            if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) { toast.error("Enter expiry as MM/YY."); return }
            if (cardCvv.length < 3) { toast.error("Enter a valid CVV."); return }
            registerMutation.mutate({
                event: selectedEvent,
                paymentMethod: eventPaymentMethod,
                cardNumber: rawNumber,
                cardHolder: cardHolder.trim(),
                cardExpiry,
                cardCvv,
            })
            return
        }
    }

    const registrationButtonLabel = selectedEvent?.isRegistered
        ? "Already Registered"
        : selectedEvent?.isFull
            ? "Event Full"
            : registerMutation.isPending && registerMutation.variables?.event.id === selectedEvent?.id
                ? "Registering..."
                : "Register"

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--iet-red-dark)" }}>Events &amp; Training</h3>
                    <p style={{ fontSize: 11.5, color: "var(--iet-muted)", marginTop: 2 }}>Upcoming IET conferences, workshops and CPD programmes</p>
                </div>
                <Link to="/dashboard/events/my-registrations" className="btn btn-red btn-sm">My Registrations</Link>
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
                                onClick={registerForSelectedEvent}
                            >
                                {registrationButtonLabel}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {selectedEvent && !selectedEvent.free && (() => {
                const originalPrice = selectedEvent.price
                const discountAmount = hasMemberDiscount ? Math.round(originalPrice * 0.2) : 0
                const finalPrice = originalPrice - discountAmount
                return (
                    <Dialog open={paymentDialogOpen} onOpenChange={(open) => { if (!open) closePaymentDialog() }}>
                        <DialogContent className="sm:max-w-md">
                            <DialogTitle>Event Registration</DialogTitle>
                            <DialogDescription>{selectedEvent.title}</DialogDescription>

                            {/* Fee row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--iet-bg)", border: "1px solid var(--iet-border)", borderRadius: 8, padding: "12px 16px" }}>
                                <span style={{ fontSize: 13, color: "var(--iet-muted)" }}>Registration fee</span>
                                <div style={{ textAlign: "right" }}>
                                    {hasMemberDiscount && (
                                        <div style={{ fontSize: 11, color: "var(--iet-muted)", textDecoration: "line-through" }}>
                                            TZS {originalPrice.toLocaleString()}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--iet-red-dark)" }}>
                                        TZS {finalPrice.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {hasMemberDiscount && (
                                <div style={{ background: "#f0faf4", border: "1px solid #b7e4c7", borderRadius: 7, padding: "8px 12px", fontSize: 11.5, color: "#1a6b3c", fontWeight: 600 }}>
                                    ✓ 20% member discount applied · {profile?.membershipClass?.replace(/_/g, " ")}
                                </div>
                            )}

                            {/* Payment method */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--iet-text)" }}>Payment Method</label>
                                <div style={{ position: "relative" }}>
                                    <select
                                        value={eventPaymentMethod}
                                        onChange={(e) => setEventPaymentMethod(e.target.value as EventPaymentMethod)}
                                        style={{
                                            width: "100%",
                                            appearance: "none",
                                            border: "1.5px solid var(--iet-border)",
                                            borderRadius: 8,
                                            background: "var(--iet-bg)",
                                            padding: "10px 36px 10px 12px",
                                            fontSize: 13,
                                            fontFamily: "Montserrat,sans-serif",
                                            fontWeight: 600,
                                            color: "var(--iet-text)",
                                            cursor: "pointer",
                                            outline: "none",
                                        }}
                                    >
                                        <optgroup label="Mobile Money">
                                            {EVENT_MOBILE_PAYMENT_METHODS.map((method) => (
                                                <option key={method} value={method}>{EVENT_PAYMENT_METHOD_LABELS[method]}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Card">
                                            <option value="SELCOM">Card Payment (Selcom)</option>
                                        </optgroup>
                                    </select>
                                    <ChevronDownIcon width="13" height="13" stroke="var(--iet-muted)" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                </div>
                            </div>

                            {/* Phone number — mobile money only */}
                            {EVENT_MOBILE_PAYMENT_METHODS.includes(eventPaymentMethod) && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--iet-text)" }}>Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={paymentPhoneNumber}
                                        onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                                        placeholder="255712000000"
                                        style={{
                                            width: "100%",
                                            border: "1.5px solid var(--iet-border)",
                                            borderRadius: 8,
                                            background: "var(--iet-bg)",
                                            padding: "10px 12px",
                                            fontSize: 13,
                                            fontFamily: "Montserrat,sans-serif",
                                            color: "var(--iet-text)",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                    <p style={{ fontSize: 11, color: "var(--iet-muted)" }}>A payment prompt will be sent to this number.</p>
                                </div>
                            )}

                            {eventPaymentMethod === "SELCOM" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {/* Card number */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--iet-text)" }}>Card Number</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={19}
                                            value={cardNumber}
                                            onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, "").slice(0, 16)
                                                setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim())
                                            }}
                                            placeholder="1234 5678 9012 3456"
                                            style={{ width: "100%", border: "1.5px solid var(--iet-border)", borderRadius: 8, background: "var(--iet-bg)", padding: "10px 12px", fontSize: 13, fontFamily: "Montserrat,sans-serif", color: "var(--iet-text)", outline: "none", boxSizing: "border-box", letterSpacing: ".05em" }}
                                        />
                                    </div>
                                    {/* Cardholder name */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--iet-text)" }}>Cardholder Name</label>
                                        <input
                                            type="text"
                                            value={cardHolder}
                                            onChange={(e) => setCardHolder(e.target.value)}
                                            placeholder="Name as it appears on card"
                                            style={{ width: "100%", border: "1.5px solid var(--iet-border)", borderRadius: 8, background: "var(--iet-bg)", padding: "10px 12px", fontSize: 13, fontFamily: "Montserrat,sans-serif", color: "var(--iet-text)", outline: "none", boxSizing: "border-box" }}
                                        />
                                    </div>
                                    {/* Expiry + CVV */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--iet-text)" }}>Expiry Date</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={5}
                                                value={cardExpiry}
                                                onChange={(e) => {
                                                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4)
                                                    setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits)
                                                }}
                                                placeholder="MM/YY"
                                                style={{ width: "100%", border: "1.5px solid var(--iet-border)", borderRadius: 8, background: "var(--iet-bg)", padding: "10px 12px", fontSize: 13, fontFamily: "Montserrat,sans-serif", color: "var(--iet-text)", outline: "none", boxSizing: "border-box" }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--iet-text)" }}>CVV</label>
                                            <input
                                                type="password"
                                                inputMode="numeric"
                                                maxLength={4}
                                                value={cardCvv}
                                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                placeholder="•••"
                                                style={{ width: "100%", border: "1.5px solid var(--iet-border)", borderRadius: 8, background: "var(--iet-bg)", padding: "10px 12px", fontSize: 13, fontFamily: "Montserrat,sans-serif", color: "var(--iet-text)", outline: "none", boxSizing: "border-box" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={closePaymentDialog}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-red"
                                    style={{
                                        flex: 2,
                                        justifyContent: "center",
                                        opacity: registerMutation.isPending ? 0.65 : 1,
                                        cursor: registerMutation.isPending ? "not-allowed" : "pointer",
                                    }}
                                    disabled={registerMutation.isPending}
                                    onClick={completePaidEventRegistration}
                                >
                                    {registerMutation.isPending ? "Processing…" : `Pay TZS ${finalPrice.toLocaleString()}`}
                                </button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )
            })()}
        </div>
    )
}
