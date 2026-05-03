import * as React from "react"
import { useMemo } from "react"
import { NavLink } from "react-router"
import { LogoutIcon } from "~/components/portal/icons"
import { useLogout } from "~/routes/auth/logout/index"
import { navSections } from "~/routes/dashboard/layouts/sidebar-list-items"
import { useMembershipFeeHistory } from "~/routes/dashboard/home/repositories/useMembershipFeeHistory"
import { useEvents } from "~/routes/dashboard/events/repositories/use-events"

type AppSidebarProps = {
    open: boolean
    userName: string
    userInitials: string
}

export function AppSidebar({ open, userName, userInitials }: AppSidebarProps) {
    const logout = useLogout()

    const { data: feesData } = useMembershipFeeHistory()
    const unpaidCount = useMemo(() => {
        return (feesData?.data ?? []).filter(
            (f) => f.status === "PENDING" || f.status === "OVERDUE"
        ).length
    }, [feesData])

    const today = new Date().toISOString().slice(0, 10)
    const { data: eventsData } = useEvents({ limit: 100, fromDate: today })
    const upcomingCount = eventsData?.data?.length ?? 0

    const badgeOverrides: Record<string, number | undefined> = {
        "/dashboard/memberships": unpaidCount > 0 ? unpaidCount : undefined,
        "/dashboard/events": upcomingCount > 0 ? upcomingCount : undefined,
    }

    return (
        <aside className={`sidebar ${open ? "open" : "collapsed"}`}>
            <div className="sidebar-logo">
                <div className="logo-img">
                    <img src="/IET-Logo-2.png" alt="IET Tanzania" />
                </div>
                <div className="logo-text">
                    <span className="org-name">
                        Institution of Engineers<br />Tanzania
                    </span>
                    <span className="org-sub">
                        Member Portal
                    </span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navSections.map((section) => (
                    <React.Fragment key={section.label}>
                        <div className="nav-section-label">{section.label}</div>
                        {section.items.map((item) => {
                            const badge = badgeOverrides[item.url]
                            return (
                                <NavLink key={item.title} to={item.url}>
                                    {({ isActive }) => (
                                        <div className={`nav-item ${isActive ? "active" : ""}`}>
                                            <span className="nav-icon">
                                                {item.icon}
                                            </span>
                                            <span>{item.title}</span>
                                            {badge != null && (
                                                <span className="nav-badge">{badge}</span>
                                            )}
                                        </div>
                                    )}
                                </NavLink>
                            )
                        })}
                    </React.Fragment>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <div className="sidebar-user">
                    <div className="user-ava-sb">
                        {userInitials}
                    </div>
                    <div className="user-info">
                        <strong>
                            {userName}
                        </strong>
                        <span>Civil Engineer, Corp.</span>
                    </div>
                    <button type="button" className="btn-logout" title="Logout" onClick={logout}>
                        <LogoutIcon className="h-[15px] w-[15px]" />
                    </button>
                </div>
            </div>
        </aside>
    )
}
