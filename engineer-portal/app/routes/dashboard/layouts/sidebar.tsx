import * as React from "react"

import {
    Sidebar,
    SidebarContent, SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar"
import {menuItems} from "~/routes/dashboard/layouts/sidebar-list-items";
import {Link, NavLink, useNavigate} from "react-router";
import {Button} from "~/components/ui/button";
import {
    getMembershipApplicationCtaLabel,
    shouldShowMembershipApplicationCta,
} from "~/utils/application-status";
import {useGetUserProfile} from "~/routes/dashboard/profile/repositories/handle-get-user-profile";


export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    const navigate = useNavigate();
    const {data} = useGetUserProfile();
    const registrationStatus = data?.data.registrationStatus;
    const shouldShowApplicationCta = shouldShowMembershipApplicationCta(registrationStatus);
    const applicationCtaLabel = getMembershipApplicationCtaLabel(registrationStatus);

    return (
        <Sidebar variant="floating" {...props} className="pr-0 border-none">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className={"flex justify-between"}>
                        <Link to="/">
                            <img src={"/IET-Logo-2.png"} alt={"IET-logo"} width={150}/>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu className="gap-2">
                        {menuItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <NavLink to={item.url}>
                                    {({isActive}) => (
                                        <SidebarMenuButton
                                            size="lg"
                                            isActive={isActive}
                                            className={isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground font-medium"}
                                        >
                                            <div className="flex items-center justify-center rounded-lg">
                                                {item.icon}
                                            </div>
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    )}
                                </NavLink>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className={"mb-4 lg:mb-0"}>
                {shouldShowApplicationCta ? (
                    <Button
                        size="lg"
                        onClick={() => navigate("/application")}
                        className="h-12 rounded-2xl bg-[#390909] text-white shadow-[0_14px_32px_rgba(57,9,9,0.18)] hover:bg-[#4A1212]"
                    >
                        {applicationCtaLabel}
                    </Button>
                ) : null}
            </SidebarFooter>
        </Sidebar>
    )
}
