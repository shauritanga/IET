import { Outlet } from "react-router"

const RingsDecoration = () => (
    <div className="auth-rings">
        <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", opacity: .22 }}>
            <circle cx="300" cy="620" r="120" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" />
            <circle cx="300" cy="620" r="200" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.5" />
            <circle cx="300" cy="620" r="280" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" />
            <circle cx="300" cy="620" r="360" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" />
            <circle cx="300" cy="620" r="440" fill="none" stroke="rgba(255,255,255,.32)" strokeWidth="1.5" />
            <circle cx="300" cy="620" r="520" fill="none" stroke="rgba(255,255,255,.24)" strokeWidth="1.5" />
            <circle cx="300" cy="620" r="600" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.5" />
        </svg>
    </div>
)

const AuthLayout = () => (
    <div className="auth-wrap">
        <div className="auth-left">
            <Outlet />
        </div>

        <div className="auth-right">
            <RingsDecoration />
            <div className="auth-welcome-card">
                <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 8 }}>Welcome To IET Engineer Portal</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.72)", lineHeight: 1.65, marginBottom: 14 }}>
                    IET is Tanzania&apos;s leading community of engineers dedicated to excellence, innovation, and professional growth.
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: "rgba(255,255,255,.45)", marginBottom: 10 }}>
                    Through IET Portal You Can:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {[
                        "Register and Manage Your Membership",
                        "Access CPD Courses",
                        "Read the Tanzania Engineer Journal",
                        "Track Events and Conferences",
                    ].map((text) => (
                        <div key={text} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "rgba(255,255,255,.85)" }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="9 12 11 14 15 10" />
                            </svg>
                            {text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
)

export default AuthLayout
