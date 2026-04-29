import * as React from "react"
import { NavLink } from "react-router"
import { LogoutIcon } from "~/components/portal/icons"
import { useLogout } from "~/routes/auth/logout/index"
import { navSections } from "~/routes/dashboard/layouts/sidebar-list-items"

type AppSidebarProps = {
    open: boolean
    userName: string
    userInitials: string
}

export function AppSidebar({ open, userName, userInitials }: AppSidebarProps) {
    const logout = useLogout()

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
                        {section.items.map((item) => (
                            <NavLink key={item.title} to={item.url}>
                                {({ isActive }) => (
                                    <div className={`nav-item ${isActive ? "active" : ""}`}>
                                        <span className="nav-icon">
                                            {item.icon}
                                        </span>
                                        <span>{item.title}</span>
                                        {item.badge != null && (
                                            <span className="nav-badge">{item.badge}</span>
                                        )}
                                    </div>
                                )}
                            </NavLink>
                        ))}
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
