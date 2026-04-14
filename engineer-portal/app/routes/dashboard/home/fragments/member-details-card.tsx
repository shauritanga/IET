import {Card} from "~/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@radix-ui/react-avatar";
import {Skeleton} from "~/components/ui/skeleton";
import type {UserProfile} from "~/routes/dashboard/profile/type";

type Props = {
    profile?: UserProfile;
    isPending: boolean;
};

const getBadgeClasses = (status?: string) => {
    if (status?.toUpperCase() === "ACTIVE") {
        return "bg-[#DDF7E5] text-[#48A764]";
    }

    if (status?.toUpperCase() === "EXPIRED") {
        return "bg-[#FADDD8] text-[#D15548]";
    }

    return "bg-[#F1ECEB] text-[#725B56]";
};

const formatDisplayDate = (value?: string) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const getFullName = (profile?: UserProfile) =>
    profile ? `${profile.title ? `${profile.title} ` : ""}${profile.firstName} ${profile.lastName}`.trim() : "";

const getInitials = (profile?: UserProfile) =>
    `${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.toUpperCase() || "UJ";

const DetailRow = ({label, value, isPending}: { label: string; value: string; isPending: boolean }) => (
    <div className="flex items-center justify-between border-b border-[#E9DEDB] py-4 last:border-b-0">
        <span className="text-sm text-[#9A867F]">{label}</span>
        {isPending ? (
            <Skeleton className="h-4 w-28 rounded-full" />
        ) : (
            <span className="text-sm font-semibold text-[#5A3E39]">{value}</span>
        )}
    </div>
);

const MemberDetailsCard = ({profile, isPending}: Props) => {
    const fullName = getFullName(profile);

    return (
        <Card className="gap-4 rounded-[28px] border border-[#EEE4E1] bg-white p-4 shadow-[0_18px_48px_rgba(95,69,60,0.08)] lg:col-span-2">
            <div className="flex items-center gap-4 p-2">
                <Avatar className="size-22 overflow-hidden rounded-full ring-4 ring-[#F5ECE9]">
                    <AvatarImage src={profile?.profilePhotoUrl ?? ""} className="size-22 rounded-full object-cover" />
                    <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-[#EDE2DE] text-lg font-semibold text-[#6A514D]">
                        {isPending ? <Skeleton className="size-22 rounded-full" /> : getInitials(profile)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    {isPending ? (
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40 rounded-full" />
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <Skeleton className="h-6 w-28 rounded-full" />
                        </div>
                    ) : (
                        <>
                            <h3 className="truncate text-[26px] font-semibold tracking-[-0.02em] text-[#4A2F2A]">{fullName || "Member Profile"}</h3>
                            <p className="mt-1 text-sm text-[#9B8782]">ID: {profile?.membershipId || "Not assigned"}</p>
                            <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses(profile?.membershipStatus)}`}>
                                {profile?.membershipStatus === "ACTIVE" ? "Active Member" : (profile?.membershipStatus || "Pending")}
                            </span>
                        </>
                    )}
                </div>
            </div>

            <div className="rounded-[24px] border border-[#F1E8E5] bg-[#FCF8F7] px-4 py-2">
                <DetailRow
                    label="Engineering Discipline"
                    value={profile?.engineeringDiscipline || "Not set"}
                    isPending={isPending}
                />
                <DetailRow
                    label="Location"
                    value={profile?.location || "Not set"}
                    isPending={isPending}
                />
                <DetailRow
                    label="Membership Class"
                    value={profile?.membershipClass || "Not assigned"}
                    isPending={isPending}
                />
                <DetailRow
                    label="Annual Membership Fee"
                    value={profile?.annualMembershipFee ? String(profile.annualMembershipFee) : "Not set"}
                    isPending={isPending}
                />
                <DetailRow
                    label="Joining Date"
                    value={formatDisplayDate(profile?.joiningDate)}
                    isPending={isPending}
                />
            </div>
        </Card>
    );
};

export default MemberDetailsCard;
