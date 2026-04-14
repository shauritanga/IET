// profile-details.tsx
import {Card} from "~/components/ui/card";
import {Skeleton} from "~/components/ui/skeleton";
import type {UserProfile} from "../type";

type Props = {
    profile?: UserProfile;
    isPending: boolean;
};

const DetailItem = ({label, value, isPending}: { label: string; value?: string; isPending: boolean }) => (
    <div>
        <p className="text-xs font-light text-muted-foreground">{label}</p>
        {isPending
            ? <Skeleton className="h-4 w-32 mt-1"/>
            : <p className="text-sm">{value ?? "—"}</p>
        }
    </div>
);

const ProfileDetails = ({profile, isPending}: Props) => {
    return (
        <Card className="w-full flex p-6 gap-4 shadow-none lg:border-none flex-col">
            <div className="border-l-2 border-blue-950 py-0.5 px-2">
                <p className="text-sm font-medium">Personal Details</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailItem label="Gender"               value={profile?.gender}         isPending={isPending}/>
                <DetailItem label="E-Mail Address"       value={profile?.email}          isPending={isPending}/>
                <DetailItem label="Phone Number"         value={profile?.phoneNumber}    isPending={isPending}/>
                <DetailItem label="Nationality"          value={profile?.nationality}    isPending={isPending}/>
                <DetailItem label="Date of Birth"        value={profile?.dateOfBirth}    isPending={isPending}/>
                <DetailItem label="Employer/Organization" value={profile?.employer}      isPending={isPending}/>
                <DetailItem label="Position/Designation" value={profile?.position}       isPending={isPending}/>
            </div>
        </Card>
    );
};

export default ProfileDetails;