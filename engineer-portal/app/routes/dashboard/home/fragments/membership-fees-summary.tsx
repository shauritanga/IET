type KpiItem = {
    icon: React.ReactNode
    value: string
    label: string
    note: string
    smallValue?: boolean
}

const kpis: KpiItem[] = [
    {
        icon: (
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        ),
        value: "2019",
        label: "Member Since",
        note: "✓ 6 years active",
    },
    {
        icon: (
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
        value: "36",
        label: "CPD Hours (2024)",
        note: "↑ 12 hrs above target",
    },
    {
        icon: (
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="16" y1="2" x2="16" y2="6" />
            </svg>
        ),
        value: "5",
        label: "Events Attended",
        note: "↑ 2 this quarter",
    },
    {
        icon: (
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
        ),
        value: "TZS 0",
        label: "Outstanding Balance",
        note: "✓ All dues cleared",
        smallValue: true,
    },
]

const KpiGrid = () => (
    <div className="grid grid-cols-4 gap-[15px] mb-[22px]">
        {kpis.map((kpi, i) => (
            <div
                key={i}
                className="cursor-default rounded-[12px] border border-[var(--iet-border)] bg-[var(--iet-white)] p-[18px_18px_14px] transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(226,12,10,.08)]"
            >
                <div className="mb-[10px] flex h-9 w-9 items-center justify-center rounded-[9px] bg-[var(--iet-red-light)] text-[var(--iet-red)]">
                    {kpi.icon}
                </div>
                <div className={`font-serif font-bold leading-none tracking-[-1px] text-[var(--iet-red-dark)] ${kpi.smallValue ? "text-[20px]" : "text-[26px]"}`}>
                    {kpi.value}
                </div>
                <div className="mt-1 text-[11px] font-medium text-[var(--iet-muted)]">
                    {kpi.label}
                </div>
                <div className="text-[10.5px] mt-[7px] text-[#1a6b3c] font-semibold">
                    {kpi.note}
                </div>
            </div>
        ))}
    </div>
)

export default KpiGrid
