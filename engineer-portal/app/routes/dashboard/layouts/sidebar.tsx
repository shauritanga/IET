import * as React from "react"
import { useMemo, useRef, useState, useEffect } from "react"
import { NavLink, useNavigate } from "react-router"
import { ChevronUp, LogOut, UserRound } from "lucide-react"
import { useLogout } from "~/routes/auth/logout/index"
import { navSections } from "~/routes/dashboard/layouts/sidebar-list-items"
import { useMembershipFeeHistory } from "~/routes/dashboard/home/repositories/useMembershipFeeHistory"
import { useEvents } from "~/routes/dashboard/events/repositories/use-events"

type AppSidebarProps = {
    open: boolean
    userName: string
    userEmail: string
    userInitials: string
    userPhotoUrl?: string | null
}

export function AppSidebar({ open, userName, userEmail, userInitials, userPhotoUrl }: AppSidebarProps) {
    const logout = useLogout()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement | null>(null)

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

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
        }
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) }
        document.addEventListener("mousedown", handle)
        document.addEventListener("keydown", handleKey)
        return () => {
            document.removeEventListener("mousedown", handle)
            document.removeEventListener("keydown", handleKey)
        }
    }, [])

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
                    <span className="org-sub">Member Portal</span>
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
                                            <span className="nav-icon">{item.icon}</span>
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

            {/* Sidebar bottom — clickable row → popup menu */}
            <div className="sidebar-bottom" style={{ position: "relative" }} ref={menuRef}>
                {/* Account popup — opens above */}
                {menuOpen && (
                    <div
                        role="menu"
                        style={{
                            position: "absolute",
                            bottom: "calc(100% + 8px)",
                            left: 8,
                            right: 8,
                            zIndex: 220,
                            borderRadius: 12,
                            border: "1px solid var(--iet-border)",
                            background: "var(--iet-white)",
                            boxShadow: "0 18px 48px rgba(0,0,0,0.16)",
                            overflow: "hidden",
                        }}
                    >
                        {/* User info */}
                        <div style={{ borderBottom: "1px solid var(--iet-border)", padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--iet-red)", border: "2px solid var(--iet-red-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0, overflow: "hidden" }}>
                                    {userPhotoUrl
                                        ? <img src={userPhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : userInitials}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--iet-red-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
                                    <div style={{ fontSize: 10, color: "var(--iet-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
                                    <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", borderRadius: 999, background: "var(--iet-red-light)", padding: "2px 8px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", color: "var(--iet-red)" }}>
                                        Member
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Menu actions */}
                        <div style={{ padding: 8 }}>
                            <button
                                role="menuitem"
                                type="button"
                                onClick={() => { setMenuOpen(false); navigate("/dashboard/profile") }}
                                style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, borderRadius: 9, padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: "var(--iet-text)", textAlign: "left", transition: "background .15s" }}
                                onMouseOver={(e) => { e.currentTarget.style.background = "var(--iet-red-pale)"; e.currentTarget.style.color = "var(--iet-red-dark)" }}
                                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--iet-text)" }}
                            >
                                <UserRound size={14} style={{ color: "var(--iet-muted)", flexShrink: 0 }} />
                                <span>Profile</span>
                            </button>

                            <div style={{ height: 1, background: "var(--iet-border)", margin: "4px 0" }} />

                            <button
                                role="menuitem"
                                type="button"
                                onClick={() => { setMenuOpen(false); logout() }}
                                style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, borderRadius: 9, padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: "var(--iet-red)", textAlign: "left", transition: "background .15s" }}
                                onMouseOver={(e) => { e.currentTarget.style.background = "var(--iet-red-pale)" }}
                                onMouseOut={(e) => { e.currentTarget.style.background = "transparent" }}
                            >
                                <LogOut size={14} style={{ flexShrink: 0 }} />
                                <span>Log out</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Trigger button */}
                <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="Open account menu"
                    style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        gap: 9,
                        borderRadius: 10,
                        border: "1px solid transparent",
                        padding: "8px 9px",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all .15s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--iet-border)"; e.currentTarget.style.background = "var(--iet-red-pale)" }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent" }}
                >
                    <div className="user-ava-sb" style={{ overflow: "hidden" }}>
                        {userPhotoUrl
                            ? <img src={userPhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                            : userInitials}
                    </div>
                    <div className="user-info" style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {userName}
                        </strong>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Member
                        </span>
                    </div>
                    <ChevronUp
                        size={14}
                        style={{
                            color: "var(--iet-muted)",
                            flexShrink: 0,
                            transition: "transform 150ms",
                            transform: menuOpen ? "rotate(0deg)" : "rotate(180deg)",
                        }}
                    />
                </button>
            </div>
        </aside>
    )
}
