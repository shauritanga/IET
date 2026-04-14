import {Avatar, AvatarFallback, AvatarImage} from "@radix-ui/react-avatar";
import {Copy, Logout2} from "@solar-icons/react/ssr";
import {Card} from "~/components/ui/card";
import {Button} from "~/components/ui/button";
import {Skeleton} from "~/components/ui/skeleton";
import {Badge} from "~/components/ui/badge";
import {useGetUserProfile} from "./repositories/handle-get-user-profile";
import {useLogout} from "~/routes/auth/logout";

const formatDate = (value?: string) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB");
};

const formatLongDate = (value?: string) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const formatPhone = (value?: string) => {
    if (!value) return "—";

    const digits = value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("255")) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }

    return value;
};

const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";

const DetailCell = ({
    label,
    value,
    isPending,
}: {
    label: string;
    value?: string;
    isPending: boolean;
}) => (
    <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#A5938E]">{label}</p>
        {isPending ? (
            <Skeleton className="h-4 w-28 rounded-full" />
        ) : (
            <p className="text-[15px] leading-6 font-medium text-[#5A3D38] md:text-[16px]">
                {value || "—"}
            </p>
        )}
    </div>
);

const SectionTitle = ({title}: { title: string }) => (
    <div className="mb-5 flex items-center gap-2.5">
        <span className="h-5 w-[2px] rounded-full bg-[#714841]" />
        <h3 className="text-base font-semibold tracking-[-0.01em] text-[#4C302A]">{title}</h3>
    </div>
);

const Profile = () => {
    const {data, isPending} = useGetUserProfile();
    const logout = useLogout();
    const profile = data?.data;
    const fullName = profile
        ? `${profile.title ? `${profile.title}. ` : ""}${profile.firstName} ${profile.lastName}`
        : "";

    return (
        <section className="flex flex-col gap-4 py-2 lg:p-4">
            <h2 className="mb-1 text-[28px] font-semibold tracking-[-0.025em] text-[#4B2F2A]">My Profile</h2>

            <Card className="flex flex-col gap-5 rounded-[20px] border border-[#EFE5E1] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(95,69,60,0.04)] md:flex-row md:items-center md:justify-between md:px-5">
                <div className="flex items-center gap-3.5">
                    <Avatar className="size-[60px] overflow-hidden rounded-full ring-3 ring-[#F2E8E4]">
                        <AvatarImage src={profile?.profilePhotoUrl ?? ""} className="size-[60px] rounded-full object-cover" />
                        <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-[#E8DEDA] text-base font-semibold text-[#604844]">
                            {isPending ? <Skeleton className="size-[60px] rounded-full" /> : getInitials(profile?.firstName, profile?.lastName)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                        {isPending ? (
                            <>
                                <Skeleton className="h-6 w-44 rounded-full" />
                                <Skeleton className="h-4 w-28 rounded-full" />
                                <Skeleton className="h-5 w-24 rounded-full" />
                            </>
                        ) : (
                            <>
                                <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-[#4D302A] md:text-[20px]">
                                    {fullName || "Member Name"}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-[#8E7974] md:text-sm">
                                    <span>ID: {profile?.membershipId || "IET/ENG/0234"}</span>
                                    <Copy className="size-[14px]" weight="BoldDuotone" />
                                </div>
                                <Badge className="w-fit rounded-full bg-[#DDF7E5] px-2.5 py-0.5 text-[11px] font-semibold text-[#48A764] shadow-none hover:bg-[#DDF7E5]">
                                    Active Member
                                </Badge>
                            </>
                        )}
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={logout}
                    className="h-10 rounded-[12px] bg-[#4C120E] px-4 text-sm font-medium text-white shadow-[0_8px_16px_rgba(76,18,14,0.18)] hover:bg-[#5B1712] md:self-start"
                >
                    <Logout2 className="mr-2 size-4" weight="BoldDuotone" />
                    Log out
                </Button>
            </Card>

            <Card className="rounded-[20px] border border-[#EFE5E1] bg-white px-5 py-5 shadow-[0_6px_18px_rgba(95,69,60,0.04)]">
                <SectionTitle title="Personal Details" />
                <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
                    <DetailCell label="Gender" value={profile?.gender} isPending={isPending} />
                    <DetailCell label="Email address" value={profile?.email} isPending={isPending} />
                    <DetailCell label="Phone Number" value={formatPhone(profile?.phoneNumber)} isPending={isPending} />
                    <DetailCell label="Nationality" value={profile?.nationality} isPending={isPending} />
                    <DetailCell label="Date of Birth" value={formatDate(profile?.dateOfBirth)} isPending={isPending} />
                    <DetailCell label="Employer / Organization" value={profile?.employer} isPending={isPending} />
                    <DetailCell label="Position / Designation" value={profile?.position} isPending={isPending} />
                    <DetailCell label="Location" value={profile?.location} isPending={isPending} />
                    <DetailCell label="Joining Date" value={formatLongDate(profile?.joiningDate)} isPending={isPending} />
                </div>

                <div className="mt-9 border-t border-[#F1E7E3] pt-7">
                    <SectionTitle title="Membership Details" />
                    <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
                        <DetailCell label="Membership ID" value={profile?.membershipId} isPending={isPending} />
                        <DetailCell label="Membership Class" value={profile?.membershipClass} isPending={isPending} />
                        <DetailCell label="Engineering Discipline" value={profile?.engineeringDiscipline} isPending={isPending} />
                        <DetailCell label="Annual Membership Fee" value={profile?.annualMembershipFee} isPending={isPending} />
                        <DetailCell label="Membership Status" value={profile?.membershipStatus} isPending={isPending} />
                        <DetailCell label="Registration Status" value={profile?.registrationStatus} isPending={isPending} />
                    </div>
                </div>
            </Card>
        </section>
    );
};

export default Profile;
