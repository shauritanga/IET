import {Link} from "react-router";
import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";
import {Skeleton} from "~/components/ui/skeleton";
import {useMembershipFeeHistory} from "../repositories/useMembershipFeeHistory";
import type {MembershipFeeHistoryItem} from "../type";
import type {UserProfile} from "~/routes/dashboard/profile/type";

type Props = {
    profile?: UserProfile;
    isPending: boolean;
};

const toCurrency = (amount: number) =>
    `${amount.toLocaleString()} TZS`;

const getStatusLabel = (status: string) => {
    switch (status) {
        case "PAID":
            return "Paid";
        case "EXPIRING":
            return "Expiring";
        case "OVERDUE":
            return "Overdue";
        default:
            return "Pending";
    }
};

const getDotColor = (status: string) => {
    switch (status) {
        case "PAID":     return "bg-[#4FA66B]";
        case "EXPIRING": return "bg-[#C7A129]";
        case "OVERDUE":  return "bg-[#D15548]";
        default:         return "bg-[#9B8782]";
    }
};

const getDotTextColor = (status: string) => {
    switch (status) {
        case "PAID":     return "text-[#4FA66B]";
        case "EXPIRING": return "text-[#C7A129]";
        case "OVERDUE":  return "text-[#D15548]";
        default:         return "text-[#75625E]";
    }
};

const membershipClassLabel = (value?: string | null) =>
    value?.replaceAll("_", " ") || "Membership";

const deriveFallbackFeeRows = (profile?: UserProfile): MembershipFeeHistoryItem[] => {
    if (!profile) return [];

    const currentYear = new Date().getFullYear();
    const joiningYear = profile.joiningDate ? new Date(profile.joiningDate).getFullYear() : currentYear;
    const annualFee = Number(String(profile.annualMembershipFee).replace(/[^\d.]/g, "")) || 10000;
    const startYear = Math.max(joiningYear, currentYear - 3);

    return Array.from({length: currentYear - startYear + 1}, (_, index) => {
        const year = currentYear - index;
        const isCurrentYear = year === currentYear;
        const status =
            isCurrentYear
                ? profile.isMembershipExpired
                    ? "OVERDUE"
                    : (profile.daysUntilExpiry ?? 999) <= 30
                        ? "EXPIRING"
                        : "PAID"
                : "PAID";

        return {
            year,
            membershipClass: profile.membershipClass,
            amount: annualFee,
            status,
            paidAt: !isCurrentYear || status === "PAID" ? `${year}-07-10T00:00:00.000Z` : null,
            dueDate: `${year}-07-10T00:00:00.000Z`,
        };
    }).slice(0, 4);
};

const FeeRow = ({fee}: { fee: MembershipFeeHistoryItem }) => (
    <div className="grid gap-3 rounded-[14px] border border-[#EEE3DF] bg-white px-4 py-3 lg:grid-cols-[1.1fr_1.2fr_0.8fr_0.7fr] lg:items-center">
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#B19A95]">{fee.year}</p>
            <p className="mt-0.5 text-base font-semibold text-[#4A2F2A]">{membershipClassLabel(fee.membershipClass)}</p>
        </div>

        <div>
            <p className="text-xs font-medium text-[#AD9892]">Membership Fees</p>
            <p className="mt-0.5 text-base font-semibold text-[#4A2F2A]">{toCurrency(fee.amount)}</p>
        </div>

        <div className="flex items-center lg:justify-center">
            <span className="inline-flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getDotColor(fee.status)}`} />
                <span className={`text-xs font-semibold ${getDotTextColor(fee.status)}`}>
                    {getStatusLabel(fee.status)}
                </span>
            </span>
        </div>

        <div className="flex justify-start lg:justify-end">
            {(fee.status === "EXPIRING" || fee.status === "OVERDUE" || fee.status === "PENDING") && (
                <Button
                    variant="outline"
                    className="h-10 rounded-xl border-[#E8DDDA] px-4 text-xs font-semibold text-[#5E4742] shadow-none"
                >
                    Pay now
                </Button>
            )}
        </div>
    </div>
);

const MembershipFeesSummary = ({profile, isPending}: Props) => {
    const {data, isPending: isFeeHistoryPending} = useMembershipFeeHistory();
    const fees = data?.data?.length ? data.data : deriveFallbackFeeRows(profile);
    const loading = isPending || isFeeHistoryPending;

    return (
        <Card className="gap-4 rounded-[28px] border border-[#EEE4E1] bg-white p-4 shadow-[0_18px_48px_rgba(95,69,60,0.08)] lg:col-span-3">
            <div className="flex items-start justify-between gap-4 px-2 pt-2">
                <div>
                    <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-[#4A2F2A]">Membership Fees</h2>
                    <p className="mt-1 text-sm text-[#9B8782]">
                        Lorem ipsum dolor sit amet, consectetur adipis.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    asChild
                    className="h-10 rounded-full bg-[#F7F0EE] px-4 text-xs font-semibold text-[#6B5450]"
                >
                    <Link to="/dashboard/memberships">View all</Link>
                </Button>
            </div>

            <div className="rounded-[24px] border border-[#F1E8E5] bg-[#FCF8F7] p-3">
                <div className="space-y-3">
                    {loading ? (
                        <>
                            <Skeleton className="h-24 w-full rounded-[22px]" />
                            <Skeleton className="h-24 w-full rounded-[22px]" />
                            <Skeleton className="h-24 w-full rounded-[22px]" />
                        </>
                    ) : fees.length > 0 ? (
                        fees.slice(0, 4).map((fee) => (
                            <FeeRow key={`${fee.year}-${fee.status}`} fee={fee} />
                        ))
                    ) : (
                        <div className="rounded-[22px] border border-dashed border-[#E7D9D5] bg-white px-5 py-10 text-center">
                            <p className="text-base font-semibold text-[#5A413D]">No membership fee records yet</p>
                            <p className="mt-2 text-sm text-[#8C7670]">
                                Your fee history will appear here once membership billing records are available.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default MembershipFeesSummary;
