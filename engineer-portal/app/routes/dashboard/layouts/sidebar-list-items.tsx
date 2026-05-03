import * as React from "react"
import { CalendarIcon, FileIcon, GridIcon, PaymentIcon, StarIcon, UserIcon } from "~/components/portal/icons"

type NavItem = {
    title: string
    url: string
    icon: React.ReactNode
    badge?: number
}

type NavSection = {
    label: string
    items: NavItem[]
}

export const navSections: NavSection[] = [
    {
        label: "Main Menu",
        items: [
            {
                title: "Overview",
                url: "/dashboard/home",
                icon: <GridIcon />,
            },
            {
                title: "Payment",
                url: "/dashboard/memberships",
                icon: <PaymentIcon />,
            },
            {
                title: "Membership",
                url: "/dashboard/membership",
                icon: <StarIcon />,
            },
            {
                title: "My Application",
                url: "/dashboard/status",
                icon: <FileIcon />,
            },
        ],
    },
    {
        label: "Engagement",
        items: [
            {
                title: "Events & Training",
                url: "/dashboard/events",
                icon: <CalendarIcon />,
            },
        ],
    },
    {
        label: "Account",
        items: [
            {
                title: "Profile",
                url: "/dashboard/profile",
                icon: <UserIcon />,
            },
        ],
    },
]

// Legacy export kept for compatibility
export const menuItems = navSections.flatMap((s) => s.items)
