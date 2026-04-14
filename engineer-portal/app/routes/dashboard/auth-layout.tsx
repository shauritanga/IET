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
import {Skeleton} from "~/components/ui/skeleton";
import {getInitials} from "~/utils/string-utils";


export default function AuthLayout() {
    const {toggleSidebar} = useSidebar();
    const user = getFromStorage<User>(USER_KEY);

    return (
        <main className="flex w-full lg:h-screen">
            <AppSidebar/>
            <SidebarInset className="px-4 lg:p-2 lg:py-2 flex-1">
                <div className="lg:bg-[#F5F0F0] h-full rounded-xl flex flex-col lg:p-4">

                    {/* Fixed Header - Mobile */}
                    <div
                        className="flex w-screen fixed top-0 items-center lg:hidden justify-between pr-7.5 py-2.5 bg-white">
                        <div className="rounded-full p-2 bg-[#f5f0f0]">
                            <HamburgerMenu className="size-6" onClick={toggleSidebar}/>
                        </div>
                        <div className="flex gap-2 items-center">
                            <ExtendedBadge
                                children={<Card className="size-5"/>}
                                caption={user?.registrationStatus ?? "No Application"}
                            />
                            <div className="rounded-full p-2 bg-[#f5f0f0]">
                                <Bell className="size-6" weight="BoldDuotone"/>
                            </div>
                            <div className="rounded-full p-2 bg-[#f5f0f0]">
                                <UserRounded className="size-6" weight="BoldDuotone"/>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Header - Desktop */}
                    <div className="shrink-0 hidden w-full lg:flex justify-between items-center px-4 gap-2 mb-2">
                        <div>
                            <SidebarTrigger/>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                            <ExtendedBadge
                                children={<Card className="size-5" weight="BoldDuotone"/>}
                                caption={user?.registrationStatus ?? "No Application"}
                            />
                            <div className="rounded-full w-fit flex items-center justify-center p-2 bg-white">
                                <Bell className="size-5" weight="BoldDuotone"/>
                            </div>
                            <ExtendedBadge
                                children={<Avatar className="size-5">
                                    <AvatarImage src={user?.profilePhotoUrl ?? ""} className="size-5 rounded-full"/>
                                    <AvatarFallback
                                        className="flex justify-center items-center bg-muted h-full w-full rounded-full">
                                        {getInitials(user?.fullName ?? "U") || <UserRounded weight={"BoldDuotone"} />}
                                    </AvatarFallback>
                                </Avatar>}
                                caption={user?.fullName ?? "UserName"}
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