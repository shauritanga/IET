import { useEffect, useMemo, useRef, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router"
import { MoonStar, SunMedium, ChevronDown, LogOut, UserRound } from "lucide-react"
import { isAxiosError } from "axios"
import { BellIcon } from "~/components/portal/icons"
import MembershipRequiredModal from "~/components/custom/membership-modal"
import { AppSidebar } from "~/routes/dashboard/layouts/sidebar"
import { useLogout } from "~/routes/auth/logout/index"
import http from "~/utils/http"
import { parseCookie } from "~/utils/parse-cookie"
import {
    AUTH_STORAGE_KEY,
    createAuthSession,
    MEMBERSHIP_STATUS_COOKIE_KEY,
    REGISTRATION_STATUS_COOKIE_KEY,
    writeAuthSession,
    type AuthSession,
} from "~/utils/otp-session"
import { setToCookie, setToStorage } from "~/utils/storage"
import { TOKEN_KEY, USER_KEY } from "~/utils/http"
import { useThemeMode } from "~/providers/theme"

type UserProfileSessionSource = {
    email: string
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    profilePhotoUrl?: string | null
    membershipStatus?: string | null
    registrationStatus?: string | null
}

export type DashboardLayoutContext = {
    openApplicationModal: () => void
}

const pageLabelMap: Record<string, string> = {
    "/dashboard/home": "Overview",
    "/dashboard/memberships": "Payment",
    "/dashboard/membership": "Membership",
    "/dashboard/events": "Events & Training",
    "/dashboard/profile": "Profile",
}

function getPageLabel(pathname: string): string {
    for (const [key, label] of Object.entries(pageLabelMap)) {
        if (pathname.startsWith(key)) return label
    }
    return "Overview"
}

function getUserInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "IE"
}

export default function AuthLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [authSession, setAuthSession] = useState<AuthSession | null>(null)
    const [membershipPromptOpen, setMembershipPromptOpen] = useState(false)
    const [headerMenuOpen, setHeaderMenuOpen] = useState(false)
    const headerMenuRef = useRef<HTMLDivElement | null>(null)
    const location = useLocation()
    const navigate = useNavigate()
    const logout = useLogout()
    const { theme, toggleTheme } = useThemeMode()
    const pageLabel = getPageLabel(location.pathname)
    const userName = authSession?.name ?? "IET Member"
    const userEmail = authSession?.email ?? ""
    const userPhotoUrl = authSession?.profilePhotoUrl ?? null
    const userInitials = useMemo(() => getUserInitials(userName), [userName])

    useEffect(() => {
        if (typeof window === "undefined") return
        const sharedToken = parseCookie(window.document.cookie, TOKEN_KEY)
        if (!sharedToken) {
            navigate("/auth/login", { replace: true })
            return
        }

        const auth = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
        if (auth) {
            try {
                const session = JSON.parse(auth) as AuthSession
                setAuthSession(session)
                return
            } catch {
                window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
            }
        }

        let cancelled = false

        const bootstrap = async () => {
            try {
                const response = await http.get<{ data: UserProfileSessionSource }>("/users/profile")
                const profile = response.data.data
                if (cancelled || !profile) return

                const name = profile.fullName?.trim()
                    || `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
                    || profile.email

                const nextSession = createAuthSession({
                    email: profile.email,
                    name,
                    profilePhotoUrl: profile.profilePhotoUrl,
                    membershipStatus: profile.membershipStatus,
                    registrationStatus: profile.registrationStatus,
                })

                setAuthSession(nextSession)
                writeAuthSession(nextSession)
                setToStorage(USER_KEY, profile)
                setToCookie(MEMBERSHIP_STATUS_COOKIE_KEY, profile.membershipStatus ?? "")
                setToCookie(REGISTRATION_STATUS_COOKIE_KEY, profile.registrationStatus ?? "")
            } catch {
                if (!cancelled) {
                    navigate("/auth/login", { replace: true })
                }
            }
        }

        void bootstrap()
        return () => {
            cancelled = true
        }
    }, [navigate])

    useEffect(() => {
        if (!authSession) return
        let cancelled = false
        const refresh = async () => {
            try {
                const response = await http.get<{ data: UserProfileSessionSource }>("/users/profile")
                const profile = response.data.data
                if (cancelled || !profile) return
                const name = profile.fullName?.trim()
                    || `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
                    || profile.email
                const nextSession = createAuthSession({
                    email: profile.email,
                    name,
                    profilePhotoUrl: profile.profilePhotoUrl,
                    membershipStatus: profile.membershipStatus,
                    registrationStatus: profile.registrationStatus,
                })
                setAuthSession(nextSession)
                writeAuthSession(nextSession)
                setToCookie(MEMBERSHIP_STATUS_COOKIE_KEY, profile.membershipStatus ?? "")
                setToCookie(REGISTRATION_STATUS_COOKIE_KEY, profile.registrationStatus ?? "")
            } catch (error) {
                if (isAxiosError(error) && error.response?.status === 401) {
                    navigate("/auth/login", { replace: true })
                }
            }
        }
        void refresh()
        return () => { cancelled = true }
    }, [authSession?.email])

    useEffect(() => {
        if (!authSession?.showMembershipPrompt) {
            setMembershipPromptOpen(false)
            return
        }
        const timer = window.setTimeout(() => setMembershipPromptOpen(true), 600)
        return () => window.clearTimeout(timer)
    }, [authSession?.showMembershipPrompt])

    // Close header menu on outside click or route change
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (!headerMenuRef.current?.contains(e.target as Node)) setHeaderMenuOpen(false)
        }
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setHeaderMenuOpen(false) }
        document.addEventListener("mousedown", handle)
        document.addEventListener("keydown", handleKey)
        return () => {
            document.removeEventListener("mousedown", handle)
            document.removeEventListener("keydown", handleKey)
        }
    }, [])

    useEffect(() => { setHeaderMenuOpen(false) }, [location.pathname])

    // On mobile/tablet (<1024px) the sidebar is an overlay drawer: closed by
    // default and auto-closed after navigating; open (persistent) on desktop.
    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(max-width: 1023px)")
        const apply = () => setSidebarOpen(!mq.matches)
        apply()
        mq.addEventListener("change", apply)
        return () => mq.removeEventListener("change", apply)
    }, [])

    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
            setSidebarOpen(false)
        }
    }, [location.pathname])

    const handleMembershipPromptClose = () => {
        setMembershipPromptOpen(false)
        if (typeof window === "undefined" || !authSession) return
        const nextSession = { ...authSession, showMembershipPrompt: false }
        setAuthSession(nextSession)
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
    }

    const openApplicationModal = () => navigate("/application")

    return (
        <div className="portal-shell">
            <AppSidebar
                open={sidebarOpen}
                userName={userName}
                userEmail={userEmail}
                userInitials={userInitials}
                userPhotoUrl={userPhotoUrl}
            />

            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-[190] bg-[rgba(57,9,9,.35)]"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className={`main ${sidebarOpen ? "" : "expanded"}`}>
                <div className="topbar">
                    <div className="topbar-left">
                        <button
                            onClick={() => setSidebarOpen((v) => !v)}
                            className="sidebar-toggle"
                            title="Toggle sidebar"
                        >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <line x1="9" y1="3" x2="9" y2="21" />
                                {!sidebarOpen && <polyline points="13 8 17 12 13 16" />}
                            </svg>
                        </button>
                        <div className="topbar-crumb">
                            <span>{pageLabel}</span>
                        </div>
                    </div>

                    <div className="topbar-right">
                        {/* Theme toggle */}
                        <button
                            type="button"
                            className="topbar-bell"
                            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            onClick={toggleTheme}
                        >
                            {theme === "dark"
                                ? <SunMedium className="h-[14px] w-[14px] stroke-[1.8]" />
                                : <MoonStar className="h-[14px] w-[14px] stroke-[1.8]" />}
                        </button>

                        {/* Notification bell with red dot */}
                        <button className="topbar-bell" title="Notifications" style={{ position: "relative" }}>
                            <BellIcon className="h-[14px] w-[14px] stroke-[1.8]" />
                            <span style={{ position: "absolute", right: 7, top: 6, width: 6, height: 6, borderRadius: "50%", background: "var(--iet-red)" }} />
                        </button>

                        {/* User pill → dropdown */}
                        <div style={{ position: "relative" }} ref={headerMenuRef}>
                            <button
                                type="button"
                                className="user-pill"
                                onClick={() => setHeaderMenuOpen((v) => !v)}
                                aria-label="Open account menu"
                                aria-haspopup="menu"
                                aria-expanded={headerMenuOpen}
                            >
                                <div className="user-pill-avatar">
                                    {userPhotoUrl
                                        ? <img src={userPhotoUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                        : userInitials}
                                </div>
                                <ChevronDown
                                    size={13}
                                    style={{
                                        color: "var(--iet-muted)",
                                        transition: "transform 150ms",
                                        transform: headerMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        flexShrink: 0,
                                    }}
                                />
                            </button>

                            {headerMenuOpen && (
                                <div
                                    role="menu"
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "calc(100% + 10px)",
                                        zIndex: 220,
                                        width: 240,
                                        borderRadius: 12,
                                        border: "1px solid var(--iet-border)",
                                        background: "var(--iet-white)",
                                        boxShadow: "0 18px 48px rgba(0,0,0,0.16)",
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* User info header */}
                                    <div style={{ borderBottom: "1px solid var(--iet-border)", padding: "12px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--iet-red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0, overflow: "hidden" }}>
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

                                    {/* Menu items */}
                                    <div style={{ padding: 8 }}>
                                        <button
                                            role="menuitem"
                                            type="button"
                                            onClick={() => { setHeaderMenuOpen(false); navigate("/dashboard/profile") }}
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
                                            onClick={() => { setHeaderMenuOpen(false); logout() }}
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
                        </div>
                    </div>
                </div>

                <div className="content">
                    <Outlet context={{ openApplicationModal } satisfies DashboardLayoutContext} />
                    <MembershipRequiredModal
                        open={membershipPromptOpen}
                        onClose={handleMembershipPromptClose}
                        onApply={openApplicationModal}
                    />
                </div>
            </div>
        </div>
    )
}
