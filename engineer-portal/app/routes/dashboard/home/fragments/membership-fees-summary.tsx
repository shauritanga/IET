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
                className="bg-white rounded-[12px] border border-[#E8D5D5] p-[18px_18px_14px] hover:shadow-[0_6px_20px_rgba(226,12,10,.08)] hover:-translate-y-[2px] transition-all duration-200 cursor-default"
            >
                <div className="w-9 h-9 rounded-[9px] bg-[#FADCDC] text-[#E20C0A] flex items-center justify-center mb-[10px]">
                    {kpi.icon}
                </div>
                <div className={`font-serif font-bold text-[#390909] leading-none tracking-[-1px] ${kpi.smallValue ? "text-[20px]" : "text-[26px]"}`}>
                    {kpi.value}
                </div>
                <div className="text-[11px] text-[#7A6060] mt-1 font-medium">
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
