// membership-details.tsx
import {Card} from "~/components/ui/card";
import {Skeleton} from "~/components/ui/skeleton";
import {Badge} from "~/components/ui/badge";
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

const AccountDetails = ({profile, isPending}: Props) => {
    return (
        <Card className="w-full flex p-6 gap-6 shadow-none lg:border-none flex-col">
            {/* Account Info */}
            <div className="flex flex-col gap-4">
                <div className="border-l-2 border-blue-950 py-0.5 px-2">
                    <p className="text-sm font-medium">Account Details</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <DetailItem label="Location"    value={profile?.location}           isPending={isPending}/>
                    <DetailItem label="Role"        value={profile?.role}               isPending={isPending}/>
                    <div>
                        <p className="text-xs font-light text-muted-foreground">Email Verified</p>
                        {isPending
                            ? <Skeleton className="h-5 w-16 mt-1"/>
                            : <Badge className="mt-1" variant={profile?.emailVerified ? "default" : "destructive"}>
                                {profile?.emailVerified ? "Verified" : "Not Verified"}
                            </Badge>
                        }
                    </div>
                    <div>
                        <p className="text-xs font-light text-muted-foreground">Account Status</p>
                        {isPending
                            ? <Skeleton className="h-5 w-16 mt-1"/>
                            : <Badge className="mt-1" variant={profile?.isActive ? "default" : "destructive"}>
                                {profile?.isActive ? "Active" : "Inactive"}
                            </Badge>
                        }
                    </div>
                    <div>
                        <p className="text-xs font-light text-muted-foreground">2FA Enabled</p>
                        {isPending
                            ? <Skeleton className="h-5 w-16 mt-1"/>
                            : <Badge className="mt-1" variant={profile?.enable2FA ? "default" : "secondary"}>
                                {profile?.enable2FA ? "Enabled" : "Disabled"}
                            </Badge>
                        }
                    </div>
                    <DetailItem label="Registration Status" value={profile?.registrationStatus} isPending={isPending}/>
                </div>
            </div>

        </Card>
    );
};

export default AccountDetails;