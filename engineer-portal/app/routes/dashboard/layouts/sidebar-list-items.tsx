import {Calendar, Card, HomeAngle2, UserRounded} from "@solar-icons/react/ssr";
import * as React from "react";

export const menuItems = [
    {
        title: "Home",
        url: "/dashboard/home",
        icon: <HomeAngle2 weight={"BoldDuotone"} size={24}/>
    },
    {
        title: "Membership",
        url: "/dashboard/memberships",
        icon: <Card weight={"BoldDuotone"} size={24}/>
    },
    {
        title: "Event & Training",
        url: "/dashboard/events",
        icon: <Calendar weight={"BoldDuotone"} size={24}/>
    },
    {
        title: "My Profile",
        url: "/dashboard/profile",
        icon: <UserRounded weight={"BoldDuotone"} size={24}/>

    },
]