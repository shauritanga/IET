import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { AxiosError } from "axios";
import http from "~/utils/http";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const fieldClassName =
        "auth-inp h-[44px] w-full pr-[13px]";

    async function handleSubmit() {
        if (submitting || !email.trim()) return;
        setSubmitting(true);
        setError(null);

        try {
            await http.post("/auth/forgot-password", {
                email: email.trim().toLowerCase(),
            });
            setSent(true);
        } catch (err) {
            const apiError = err as AxiosError<{ message?: string }>;
            setError(apiError.response?.data?.message ?? "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-left-inner">
            <div className="auth-logo-block">
                <div className="auth-logo-img-big">
                    <img src="/IET-logo.png" alt="IET Tanzania" />
                </div>
                <div className="auth-logo-org">
                    Institution of Engineers
                    <br />
                    Tanzania
                </div>
            </div>

            {sent ? (
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-[56px] w-[56px] items-center justify-center rounded-full border border-green-100 bg-green-50">
                        <CheckCircle2 size={26} className="text-green-500" />
                    </div>
                    <div className="auth-h">Check Your Email</div>
                    <p className="auth-sub mx-auto mt-[8px] max-w-[300px]">
                        If <span className="font-semibold text-[var(--iet-text)]">{email}</span> is registered,
                        you will receive a password reset link shortly. Check your spam folder if it does not
                        arrive within a few minutes.
                    </p>
                    <Link
                        to="/auth/login"
                        className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--iet-red)] hover:underline"
                    >
                        <ArrowLeft size={13} />
                        Back to Sign In
                    </Link>
                </div>
            ) : (
                <div>
                    <div className="mx-auto mb-5 flex h-[48px] w-[48px] items-center justify-center rounded-full border border-[var(--iet-border)] bg-[var(--iet-red-pale)]">
                        <Mail size={20} className="text-[var(--iet-red)]" />
                    </div>

                    <div className="auth-h text-center">Forgot Password?</div>
                    <p className="auth-sub mx-auto mt-[5px] max-w-[290px] text-center">
                        Enter your registered email address and we will send you a link to reset your password.
                    </p>

                    <div className="mt-[22px]">
                        <div className="auth-group">
                            <label htmlFor="email" className="auth-lbl">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                placeholder="example@gmail.com"
                                onChange={(event) => setEmail(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        void handleSubmit();
                                    }
                                }}
                                className={fieldClassName}
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        {error ? (
                            <div className="mb-4 rounded-[10px] border border-[#f0b0b0] bg-[var(--iet-red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--iet-red)]">
                                {error}
                            </div>
                        ) : null}

                        <button
                            className="auth-btn-main flex w-full items-center justify-center gap-2"
                            type="button"
                            onClick={() => void handleSubmit()}
                            disabled={submitting || !email.trim()}
                        >
                            <span>{submitting ? "Sending..." : "Send Reset Link"}</span>
                            {!submitting ? <ArrowRight size={14} /> : null}
                        </button>

                        <div className="mt-5 text-center">
                            <Link
                                to="/auth/login"
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--iet-muted)] hover:text-[var(--iet-text)]"
                            >
                                <ArrowLeft size={12} />
                                Back to Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
