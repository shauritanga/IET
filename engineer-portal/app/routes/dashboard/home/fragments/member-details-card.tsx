type ActivityItem = {
    icon: React.ReactNode
    iconBg?: string
    iconColor?: string
    text: React.ReactNode
    time: string
}

const activities: ActivityItem[] = [
    {
        icon: (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
        ),
        text: <>Annual subscription paid — <strong>TZS 150,000</strong></>,
        time: "Jan 10, 2025 · M-Pesa",
    },
    {
        icon: (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
        iconBg: "#E8F5E9", iconColor: "#1a6b3c",
        text: <>Attended &ldquo;Sustainable Infrastructure&rdquo; Seminar — <strong>6 CPD hrs</strong></>,
        time: "Dec 14, 2024 · Dar es Salaam",
    },
    {
        icon: (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
        ),
        iconBg: "#FFF8E1", iconColor: "#F57F17",
        text: <>Uploaded CPD Activity Record for Q4 2024</>,
        time: "Dec 8, 2024",
    },
]

const RecentActivity = () => (
    <div className="overflow-hidden rounded-[14px] border border-[var(--iet-border)] bg-[var(--iet-white)]">
        <div className="flex items-center justify-between border-b border-[var(--iet-border)] px-5 py-4">
            <span className="text-[13px] font-bold text-[var(--iet-red-dark)]">Recent Activity</span>
            <span className="cursor-pointer text-[11.5px] font-semibold text-[var(--iet-red)] hover:underline">View all</span>
        </div>
        <div className="px-5 py-1">
            {activities.map((a, i) => (
                <div
                    key={i}
                    className={`flex items-start gap-[11px] py-[10px] ${i < activities.length - 1 ? "border-b border-[var(--iet-border)]" : ""}`}
                >
                    <div
                        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
                        style={{
                            background: a.iconBg ?? "#FADCDC",
                            color: a.iconColor ?? "#E20C0A",
                        }}
                    >
                        {a.icon}
                    </div>
                    <div>
                        <div className="text-[12px] leading-[1.45] text-[var(--iet-text)]">{a.text}</div>
                        <div className="mt-[2px] text-[10.5px] text-[var(--iet-muted)]">{a.time}</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
)

export default RecentActivity
