import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { resendOtp } from "~/routes/auth/verify-otp/requests/resend-otp"
import { validateTwoFactor } from "~/routes/auth/verify-otp/requests/validate-2fa"
import { verifyEmail } from "~/routes/auth/verify-otp/requests/verify-email"
import type { TErrorMessage } from "~/types"
import {
    createAuthSession,
    clearOtpSession,
    readOtpSession,
    writeAuthSession,
    type OtpSession,
} from "~/utils/otp-session"
import { TOKEN_KEY, USER_KEY } from "~/utils/http"
import { setToCookie, setToStorage } from "~/utils/storage"

function maskEmail(email: string) {
    const [localPart, domain = ""] = email.split("@")
    if (!localPart) return email
    const start = localPart.slice(0, 2)
    return `${start}${"*".repeat(Math.max(localPart.length - 2, 2))}@${domain}`
}

const VerifyOtpForm = () => {
    const navigate = useNavigate()
    const [otpSession, setOtpSession] = useState<OtpSession | null>(() => readOtpSession())
    const [code, setCode] = useState("")
    const [timer, setTimer] = useState(30)
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        const session = readOtpSession()
        if (!session) {
            navigate("/auth/login", { replace: true })
            return
        }
        setOtpSession(session)
    }, [navigate])

    useEffect(() => {
        if (timer <= 0) return
        const interval = window.setInterval(() => {
            setTimer((current) => (current <= 1 ? 0 : current - 1))
        }, 1000)
        return () => window.clearInterval(interval)
    }, [timer])

    const isEmailVerification = otpSession?.flow === "email-verification"
    const title = isEmailVerification ? "Verify your email" : "Complete sign in"
    const description = isEmailVerification
        ? `Enter the verification code sent to ${otpSession ? maskEmail(otpSession.email) : "your email"}.`
        : "Enter the 6-digit code from your authenticator app to finish logging in."
    const codePlaceholder = isEmailVerification ? "IET-123456" : "123456"

    const normalizedCode = useMemo(() => {
        return isEmailVerification ? code.trim().toUpperCase() : code.replace(/\D/g, "").slice(0, 6)
    }, [code, isEmailVerification])

    const completeAuth = (payload: { accessToken: string; refreshToken: string; user: any }) => {
        setToCookie(TOKEN_KEY, payload.accessToken)
        setToCookie("global-rt", payload.refreshToken)
        if (payload.user.registrationStatus) {
            setToCookie("global-ms", payload.user.registrationStatus)
        }
        setToStorage(USER_KEY, payload.user)
        writeAuthSession(createAuthSession({
            email: payload.user.email,
            name: payload.user.fullName ?? payload.user.email,
            membershipStatus: payload.user.membershipStatus,
        }))
        clearOtpSession()
        navigate("/dashboard/home", { replace: true })
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!otpSession) return

        setError("")
        setIsSubmitting(true)

        try {
            if (otpSession.flow === "email-verification") {
                const result = await verifyEmail({
                    email: otpSession.email,
                    code: normalizedCode,
                })
                completeAuth(result)
                return
            }

            if (!otpSession.userId) {
                setError("The sign-in session is incomplete. Please log in again.")
                return
            }

            const result = await validateTwoFactor({
                userId: otpSession.userId,
                token: normalizedCode,
            })

            if (!result.verified || !result.accessToken || !result.refreshToken || !result.user) {
                setError("Invalid authenticator code.")
                return
            }

            completeAuth({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            })
        } catch (error) {
            const apiError = error as TErrorMessage
            setError(apiError.response?.data.message ?? "Verification failed.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResend = async () => {
        if (!otpSession || otpSession.flow !== "email-verification" || timer > 0) return

        setError("")
        setIsResending(true)

        try {
            await resendOtp({ email: otpSession.email })
            setTimer(30)
        } catch (error) {
            const apiError = error as TErrorMessage
            setError(apiError.response?.data.message ?? "Failed to resend verification code.")
        } finally {
            setIsResending(false)
        }
    }

    if (!otpSession) return null

    return (
        <div className="auth-left-inner" style={{ textAlign: "center" }}>
            <div className="auth-logo-block">
                <div className="auth-logo-img-big"><img src="/IET-logo.png" alt="IET Tanzania" /></div>
                <div className="auth-logo-org">Institution of Engineers<br />Tanzania</div>
            </div>

            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--iet-red-pale)", border: "2px solid rgba(226,12,10,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="24" height="24" fill="none" stroke="var(--iet-red)" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>

            <div className="auth-h">{title}</div>
            <div className="auth-sub">
                {description}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="auth-group" style={{ textAlign: "left", marginTop: 24 }}>
                    <label className="auth-lbl">{isEmailVerification ? "Verification Code" : "Authenticator Code"}</label>
                    <input
                        className="auth-inp"
                        type="text"
                        autoComplete="one-time-code"
                        inputMode={isEmailVerification ? "text" : "numeric"}
                        placeholder={codePlaceholder}
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                    />
                    <div className="auth-err" style={{ textAlign: "center", marginTop: 8 }}>{error}</div>
                </div>

                <button className="auth-btn-main" type="submit" style={{ maxWidth: 280, margin: "0 auto" }} disabled={isSubmitting}>
                    {isSubmitting ? "Verifying..." : "Verify & Continue"}
                </button>

                {isEmailVerification ? (
                    <div style={{ fontSize: 12.5, color: "var(--iet-muted)", textAlign: "center", marginTop: 16 }}>
                        Didn&apos;t receive it?{" "}
                        <button
                            type="button"
                            disabled={timer > 0 || isResending}
                            onClick={() => { void handleResend() }}
                            style={{ color: timer > 0 ? "var(--iet-muted)" : "var(--iet-red)", fontWeight: 700, cursor: timer > 0 ? "not-allowed" : "pointer", background: "transparent", border: "none", padding: 0 }}
                        >
                            {isResending ? "Sending..." : "Resend code"}
                        </button>{" "}
                        <span style={{ color: "var(--iet-muted)", fontSize: 11 }}>{timer > 0 ? `(00:${String(timer).padStart(2, "0")})` : ""}</span>
                    </div>
                ) : null}
            </form>

            <div className="auth-switch" style={{ marginTop: 18 }}>
                <button
                    type="button"
                    onClick={() => {
                        clearOtpSession()
                        navigate("/auth/login", { replace: true })
                    }}
                    style={{ background: "transparent", border: "none", padding: 0, color: "var(--iet-red)", fontWeight: 700, cursor: "pointer" }}
                >
                    &larr; Back to login
                </button>
            </div>
            <div className="auth-footer">&#169; 2025 Institute of Engineers Tanzania</div>
        </div>
    )
}

export default VerifyOtpForm
