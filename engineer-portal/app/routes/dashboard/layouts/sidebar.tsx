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
import {Logout2} from "@solar-icons/react/ssr";
import {Link, NavLink, useNavigate} from "react-router";
import {useLogout} from "~/routes/auth/logout";
import {Button} from "~/components/ui/button";


export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    const logout = useLogout();
    const navigate = useNavigate();
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
                <Button asChild size="lg" onClick={() => navigate("/application")}>
                    <div className={"font-medium text-muted-foreground"}>
                        Apply for Membership
                    </div>
                </Button>
                <SidebarMenuButton asChild size="lg" onClick={logout}>
                    <div className={"font-medium text-muted-foreground"}>
                        <div className="flex items-center justify-center rounded-lg">
                            <Logout2 weight={"BoldDuotone"} size={24}/>
                        </div>
                        <div>
                            Logout
                        </div>
                    </div>
                </SidebarMenuButton>
            </SidebarFooter>
        </Sidebar>
    )
}
