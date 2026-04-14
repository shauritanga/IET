// profile-summary-card.tsx
import {Badge} from "~/components/ui/badge";
import {Card} from "~/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@radix-ui/react-avatar";
import {Skeleton} from "~/components/ui/skeleton";
import type {UserProfile} from "../type";

type Props = {
    profile?: UserProfile;
    isPending: boolean;
};



const ProfileSummaryCard = ({profile, isPending}: Props) => {

const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "";

    const initials = fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "??";

    return (
        <Card className="w-full flex flex-row p-4 gap-4 items-center shadow-none lg:border-none">
            <div className="flex items-center gap-4 lg:p-2">
                <Avatar className="size-20">
                    <AvatarImage src={profile?.profilePhotoUrl ?? ""} className="rounded-full size-20"/>
                    <AvatarFallback className="flex justify-center items-center bg-muted h-full w-full rounded-full">
                        {isPending ? <Skeleton className="size-20 rounded-full"/> : initials}
                    </AvatarFallback>
                </Avatar>
                <div>
                    {isPending ? (
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40"/>
                            <Skeleton className="h-3 w-24"/>
                            <Skeleton className="h-5 w-20"/>
                        </div>
                    ) : (
                        <>
                            <p className="font-semibold lg:text-xl mb-1">{profile ? `${profile.title} ${fullName}` : "N/A"}</p>
                            <p className="font-light text-xs text-muted-foreground mb-1">
                                ID: {profile?.membershipId ?? "N/A"}
                            </p>
                            <Badge>{profile?.membershipStatus}</Badge>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default ProfileSummaryCard;