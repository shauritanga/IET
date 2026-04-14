import {
    SidebarInset,
    SidebarTrigger,
    useSidebar
} from "~/components/ui/sidebar"
import {AppSidebar} from "~/routes/dashboard/layouts/sidebar";
import {Outlet} from "react-router";
import {Bell, Card, HamburgerMenu, UserRounded} from "@solar-icons/react/ssr";
import ExtendedBadge from "~/components/custom/extended-badge";
import MembershipRequiredModal from "~/components/custom/membership-modal";
import {getFromStorage} from "~/utils/storage";
import {USER_KEY} from "~/utils/http";
import type {User} from "../auth/types";
import {Avatar, AvatarFallback, AvatarImage} from "@radix-ui/react-avatar";
import {getInitials} from "~/utils/string-utils";
import {getRegistrationStatusLabel} from "~/utils/application-status";
import {useGetUserProfile} from "~/routes/dashboard/profile/repositories/handle-get-user-profile";


export default function AuthLayout() {
    const {toggleSidebar} = useSidebar();
    const user = getFromStorage<User>(USER_KEY);
    const {data: profileData} = useGetUserProfile();
    const registrationCaption = getRegistrationStatusLabel(
        profileData?.data.registrationStatus ?? user?.registrationStatus,
    );

    return (
        <main className="flex w-full lg:h-screen">
            <AppSidebar/>
            <SidebarInset className="px-4 lg:p-2 lg:py-2 flex-1">
                <div className="h-full rounded-[24px] bg-[#F5F0F0] flex flex-col p-3 lg:p-4">

                    {/* Fixed Header - Mobile */}
                    <div
                        className="fixed top-0 left-0 z-20 flex w-full items-center justify-between border-b border-[#EFE4E1] bg-[#F5F0F0]/95 px-4 py-2.5 backdrop-blur lg:hidden">
                        <div className="rounded-[14px] border border-[#E8DEDB] bg-white p-2 shadow-[0_4px_10px_rgba(92,68,64,0.05)]">
                            <HamburgerMenu className="size-6" onClick={toggleSidebar}/>
                        </div>
                        <div className="flex gap-2 items-center">
                            <ExtendedBadge
                                children={<Card className="size-5"/>}
                                caption={registrationCaption}
                                className="h-10 rounded-[16px] border border-[#E8DEDB] bg-white px-2 py-1 shadow-[0_4px_10px_rgba(92,68,64,0.05)]"
                                indicatorClassName="bg-[#F6F1EF] p-1"
                                captionClassName="text-xs font-medium text-[#5B4540]"
                            />
                            <div className="flex size-10 items-center justify-center rounded-[14px] border border-[#E8DEDB] bg-white shadow-[0_4px_10px_rgba(92,68,64,0.05)]">
                                <Bell className="size-[18px] text-[#6F5A56]" weight="BoldDuotone"/>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-[14px] border border-[#E8DEDB] bg-white shadow-[0_4px_10px_rgba(92,68,64,0.05)]">
                                <UserRounded className="size-[18px] text-[#6F5A56]" weight="BoldDuotone"/>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Header - Desktop */}
                    <div className="mb-2 hidden w-full shrink-0 items-center justify-between px-2 lg:flex">
                        <div>
                            <SidebarTrigger/>
                        </div>
                        <div className="shrink-0 flex items-center gap-2.5">
                            <ExtendedBadge
                                children={<Card className="size-4" weight="BoldDuotone"/>}
                                caption={registrationCaption}
                                className="h-11 rounded-[18px] border border-[#E9DEDA] bg-white px-2.5 py-1 shadow-[0_5px_14px_rgba(92,68,64,0.05)]"
                                indicatorClassName="bg-[#F7F1EF] p-1.5"
                                captionClassName="text-sm font-medium tracking-[-0.01em] text-[#4F3934]"
                            />
                            <div className="flex size-11 items-center justify-center rounded-[16px] border border-[#E9DEDA] bg-white shadow-[0_5px_14px_rgba(92,68,64,0.05)]">
                                <Bell className="size-[18px] text-[#6F5A56]" weight="BoldDuotone"/>
                            </div>
                            <ExtendedBadge
                                children={<Avatar className="size-8">
                                    <AvatarImage src={user?.profilePhotoUrl ?? ""} className="size-8 rounded-full object-cover"/>
                                    <AvatarFallback
                                        className="flex justify-center items-center bg-[#EDE3DF] h-full w-full rounded-full text-xs font-semibold text-[#5E4641]">
                                        {getInitials(user?.fullName ?? "U") || <UserRounded weight={"BoldDuotone"} />}
                                    </AvatarFallback>
                                </Avatar>}
                                caption={user?.fullName ?? "UserName"}
                                className="h-11 rounded-[18px] border border-[#E9DEDA] bg-white px-2.5 py-1 shadow-[0_5px_14px_rgba(92,68,64,0.05)]"
                                indicatorClassName="bg-transparent p-0"
                                captionClassName="text-sm font-medium tracking-[-0.01em] text-[#4F3934]"
                            />
                        </div>
                    </div>

                    {/* Scrollable Outlet */}
                    <div className="mt-16 lg:mt-0 flex-1 overflow-y-auto no-scrollbar">
                        <Outlet/>
                        <MembershipRequiredModal/>
                    </div>
                </div>
            </SidebarInset>
        </main>
    );
}
