import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
    createAuthSession,
    createOtpSession,
    MEMBERSHIP_STATUS_COOKIE_KEY,
    REGISTRATION_STATUS_COOKIE_KEY,
    writeAuthSession,
} from "~/utils/otp-session"
import { loginUser } from "~/routes/auth/login/requests/login-user"
import { rememberDays, setRemember, setToCookie, setToStorage } from "~/utils/storage"
import { TOKEN_KEY, USER_KEY } from "~/utils/http"
import type { TErrorMessage } from "~/types"

const EyeIcon = ({ open }: { open: boolean }) => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        {open
            ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
        }
    </svg>
)

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        let valid = true
        setEmailError("")
        setPasswordError("")

        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Valid email required.")
            valid = false
        }

        if (!password || password.length < 6) {
            setPasswordError("Password must be at least 6 characters.")
            valid = false
        }

        if (!valid) return
        setIsSubmitting(true)

        try {
            const result = await loginUser({
                email: email.trim(),
                password,
            })

            // Record the choice before any 2FA redirect so the tokens written
            // after OTP verification inherit the persistence too.
            setRemember(rememberMe)

            if ("validate2FA" in result) {
                createOtpSession({
                    flow: "login-2fa",
                    email: email.trim(),
                    name: email.trim(),
                    userId: result.validate2FA,
                    smsDestination: result.smsDestination,
                })

                navigate("/auth/verify-otp", { replace: true })
                return
            }

            const rememberTtl = rememberDays()
            setToCookie(TOKEN_KEY, result.accessToken, rememberTtl)
            setToCookie("global-rt", result.refreshToken, rememberTtl)
            setToCookie(MEMBERSHIP_STATUS_COOKIE_KEY, result.user.membershipStatus ?? "", rememberTtl)
            setToCookie(REGISTRATION_STATUS_COOKIE_KEY, result.user.registrationStatus ?? "", rememberTtl)
            setToStorage(USER_KEY, result.user)
            writeAuthSession(createAuthSession({
                email: result.user.email,
                name: result.user.fullName ?? result.user.email,
                membershipStatus: result.user.membershipStatus,
                registrationStatus: result.user.registrationStatus,
            }))
            navigate("/dashboard/home", { replace: true })
        } catch (error) {
            const apiError = error as TErrorMessage
            setPasswordError(apiError.response?.data.message ?? "Invalid email or password.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="auth-left-inner">
            <div className="auth-logo-block">
                <div className="auth-logo-img-big"><img src="/IET-logo.png" alt="IET Tanzania" /></div>
                <div className="auth-logo-org">Institution of Engineers<br />Tanzania</div>
            </div>

            <div className="auth-h">Log In</div>
            <div className="auth-sub">Please enter your registered email and password below to Sign in.</div>

            <form onSubmit={handleSubmit}>
                <div className="auth-group">
                    <label className="auth-lbl">Email</label>
                    <input
                        className="auth-inp"
                        type="email"
                        placeholder="example@gmail.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="auth-err">{emailError}</div>
                </div>

                <div className="auth-group">
                    <label className="auth-lbl">Password</label>
                    <div style={{ position: "relative" }}>
                        <input
                            className="auth-inp"
                            style={{ paddingRight: 40 }}
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--iet-muted)", background: "transparent", border: "none", padding: 0 }}
                        >
                            <EyeIcon open={showPassword} />
                        </button>
                    </div>
                    <div className="auth-err">{passwordError}</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--iet-muted)", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ accentColor: "var(--iet-red-dark)", width: 14, height: 14 }}
                        />
                        Remember me for 7 days
                    </label>
                    <Link to="/auth/forgot-password" style={{ fontSize: 12.5, color: "var(--iet-red)", fontWeight: 600, textDecoration: "none" }}>
                        Forgot Password?
                    </Link>
                </div>

                <button className="auth-btn-main" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Signing In..." : "Sign In"}
                </button>
            </form>

            <div className="auth-switch" style={{ marginTop: 20 }}>
                Don&apos;t have an account? <Link to="/auth/register">Click here to register</Link>
            </div>
            <div className="auth-footer">&#169; 2026 Institute of Engineers Tanzania</div>
        </div>
    )
}

export default LoginForm
