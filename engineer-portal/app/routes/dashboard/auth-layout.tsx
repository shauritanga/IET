import { useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, NavLink, useNavigate } from "react-router"
import { BellIcon } from "~/components/portal/icons"
import MembershipRequiredModal from "~/components/custom/membership-modal"
import { AppSidebar } from "~/routes/dashboard/layouts/sidebar"
import http from "~/utils/http"
import {
    AUTH_STORAGE_KEY,
    createAuthSession,
    MEMBERSHIP_STATUS_COOKIE_KEY,
    REGISTRATION_STATUS_COOKIE_KEY,
    writeAuthSession,
    type AuthSession,
} from "~/utils/otp-session"
import { setToCookie } from "~/utils/storage"
import { MoonStar, SunMedium } from "lucide-react"
import { useThemeMode } from "~/providers/theme"

type UserProfileSessionSource = {
    email: string
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
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

function getTodayString(): string {
    return new Date().toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
    })
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
    const location = useLocation()
    const navigate = useNavigate()
    const { theme, toggleTheme } = useThemeMode()
    const pageLabel = getPageLabel(location.pathname)
    const userName = authSession?.name ?? "IET Member"
    const userInitials = useMemo(() => getUserInitials(userName), [userName])

    useEffect(() => {
        if (typeof window === "undefined") return
        const auth = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
        if (!auth) {
            navigate("/auth/login", { replace: true })
            return
        }

        try {
            const session = JSON.parse(auth) as AuthSession
            setAuthSession(session)
        } catch {
            window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
            navigate("/auth/login", { replace: true })
        }
    }, [navigate])

    useEffect(() => {
        if (!authSession) return

        let cancelled = false

        const refreshPromptState = async () => {
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
                    membershipStatus: profile.membershipStatus,
                    registrationStatus: profile.registrationStatus,
                })

                setAuthSession(nextSession)
                writeAuthSession(nextSession)
                setToCookie(MEMBERSHIP_STATUS_COOKIE_KEY, profile.membershipStatus ?? "")
                setToCookie(REGISTRATION_STATUS_COOKIE_KEY, profile.registrationStatus ?? "")
            } catch {
                // Keep the locally restored session if the profile refresh fails.
            }
        }

        void refreshPromptState()

        return () => {
            cancelled = true
        }
    }, [authSession?.email])

    useEffect(() => {
        if (!authSession?.showMembershipPrompt) {
            setMembershipPromptOpen(false)
            return
        }

        const timer = window.setTimeout(() => {
            setMembershipPromptOpen(true)
        }, 600)

        return () => window.clearTimeout(timer)
    }, [authSession?.showMembershipPrompt])

    const handleMembershipPromptClose = () => {
        setMembershipPromptOpen(false)

        if (typeof window === "undefined" || !authSession) return

        const nextSession = { ...authSession, showMembershipPrompt: false }
        setAuthSession(nextSession)
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
    }

    const openApplicationModal = () => {
        navigate("/application")
    }

    return (
        <div className="portal-shell">
            <AppSidebar
                open={sidebarOpen}
                userName={userName}
                userInitials={userInitials}
            />

            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-[190] bg-[rgba(57,9,9,.35)]"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div
                className={`main ${sidebarOpen ? "" : "expanded"}`}
            >
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
                        <div className="topbar-crumb">IET Tanzania &rsaquo; <span>{pageLabel}</span></div>
                    </div>

                    <div className="topbar-right">
                        <div className="top-date">{getTodayString()}</div>

                        <button
                            type="button"
                            className="topbar-bell"
                            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            onClick={toggleTheme}
                        >
                            {theme === "dark" ? (
                                <SunMedium className="h-[14px] w-[14px] stroke-[1.8]" />
                            ) : (
                                <MoonStar className="h-[14px] w-[14px] stroke-[1.8]" />
                            )}
                        </button>

                        <button
                            className="topbar-bell"
                            title="Notifications"
                        >
                            <BellIcon className="h-[14px] w-[14px] stroke-[1.8]" />
                        </button>

                        <NavLink
                            to="/dashboard/profile"
                            className="user-pill"
                        >
                            <div className="user-pill-avatar">{userInitials}</div>
                            <span className="user-pill-name">{userName}</span>
                        </NavLink>
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
