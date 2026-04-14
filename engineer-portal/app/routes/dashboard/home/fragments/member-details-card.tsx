// member-details-card.tsx
import {Card} from "~/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@radix-ui/react-avatar";
import {Badge} from "~/components/ui/badge";
import {Skeleton} from "~/components/ui/skeleton";
import type {UserProfile} from "~/routes/dashboard/profile/type";

type Props = {
    profile?: UserProfile;
    isPending: boolean;
};

const DetailRow = ({label, value, isPending}: { label: string; value?: string; isPending: boolean }) => (
    <div className="py-4 px-2 border-b border-neutral-200 last:border-0 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        {isPending
            ? <Skeleton className="h-3 w-24"/>
            : <span className="text-xs font-semibold">{value ?? "—"}</span>
        }
    </div>
);

const MemberDetailsCard = ({profile, isPending}: Props) => {
    const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "";

    const initials = fullName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() ?? "??";

    return (
        <Card className="shadow-xs lg:col-span-2 lg:border-none p-2 gap-2">
            <div className="flex items-center gap-4 p-2">
                <Avatar className="size-20">
                    <AvatarImage src={profile?.profilePhotoUrl ?? ""} className="size-20 rounded-full"/>
                    <AvatarFallback className="flex justify-center items-center bg-muted h-full w-full rounded-full">
                        {isPending ? <Skeleton className="size-20 rounded-full"/> : initials}
                    </AvatarFallback>
                </Avatar>
                <div>
                    {isPending ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-36"/>
                            <Skeleton className="h-3 w-24"/>
                            <Skeleton className="h-5 w-20"/>
                        </div>
                    ) : (
                        <>
                            <p className="font-medium mb-1">{fullName}</p>
                            <p className="font-light text-xs text-muted-foreground mb-1">
                                ID: {profile?.membershipId ?? "—"}
                            </p>
                            <Badge>{profile?.membershipStatus ?? "—"}</Badge>
                        </>
                    )}
                </div>
            </div>
            <Card className="border-none bg-muted shadow-none p-2 gap-2">
                <DetailRow label="Engineering Discipline" value={profile?.engineeringDiscipline} isPending={isPending}/>
                <DetailRow label="Location"               value={profile?.location}              isPending={isPending}/>
                <DetailRow label="Membership Class"       value={profile?.membershipClass}       isPending={isPending}/>
                <DetailRow label="Annual Membership Fee"  value={profile?.annualMembershipFee}   isPending={isPending}/>
                <DetailRow label="Joining Date"           value={profile?.joiningDate}           isPending={isPending}/>
            </Card>
        </Card>
    );
};

export default MemberDetailsCard;