import { useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, NavLink, useNavigate } from "react-router"
import ApplicationModal from "~/components/custom/application-modal"
import { BellIcon } from "~/components/portal/icons"
import MembershipRequiredModal from "~/components/custom/membership-modal"
import { AppSidebar } from "~/routes/dashboard/layouts/sidebar"

const AUTH_STORAGE_KEY = "iet-demo-auth"
const APPLICATION_MODAL_FLAG_KEY = "iet-demo-open-application-modal"

type AuthSession = {
    email: string
    name: string
    showMembershipPrompt?: boolean
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
    const [applicationModalOpen, setApplicationModalOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
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
        if (!authSession?.showMembershipPrompt) {
            setMembershipPromptOpen(false)
            return
        }

        const timer = window.setTimeout(() => {
            setMembershipPromptOpen(true)
        }, 600)

        return () => window.clearTimeout(timer)
    }, [authSession?.showMembershipPrompt])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!location.pathname.startsWith("/dashboard/membership")) return

        const shouldOpenFromStorage = window.sessionStorage.getItem(APPLICATION_MODAL_FLAG_KEY) === "true"
        const shouldOpenFromState = Boolean(location.state && typeof location.state === "object" && "openApplicationModal" in location.state && location.state.openApplicationModal)

        if (!shouldOpenFromStorage && !shouldOpenFromState) return

        setApplicationModalOpen(true)
        window.sessionStorage.removeItem(APPLICATION_MODAL_FLAG_KEY)

        if (shouldOpenFromState) {
            navigate(location.pathname, { replace: true, state: null })
        }
    }, [location.pathname, location.state, navigate])

    const handleMembershipPromptClose = () => {
        setMembershipPromptOpen(false)

        if (typeof window === "undefined" || !authSession) return

        const nextSession = { ...authSession, showMembershipPrompt: false }
        setAuthSession(nextSession)
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
    }

    const openApplicationModal = () => {
        if (typeof window !== "undefined") {
            window.sessionStorage.setItem(APPLICATION_MODAL_FLAG_KEY, "true")
        }

        if (location.pathname.startsWith("/dashboard/membership")) {
            setApplicationModalOpen(true)
            if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(APPLICATION_MODAL_FLAG_KEY)
            }
            return
        }

        navigate("/dashboard/membership", {
            state: { openApplicationModal: true },
        })
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
                    <ApplicationModal
                        open={applicationModalOpen}
                        onClose={() => setApplicationModalOpen(false)}
                        userName={userName}
                        userInitials={userInitials}
                    />
                </div>
            </div>
        </div>
    )
}
