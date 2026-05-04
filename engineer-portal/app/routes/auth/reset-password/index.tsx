import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { AxiosError } from "axios";
import http from "~/utils/http";

type Requirement = { label: string; test: (password: string) => boolean };

const PASSWORD_REQUIREMENTS: Requirement[] = [
    { label: "At least 8 characters", test: (password) => password.length >= 8 },
    { label: "One uppercase letter (A-Z)", test: (password) => /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", test: (password) => /[a-z]/.test(password) },
    { label: "One number (0-9)", test: (password) => /\d/.test(password) },
    { label: "One special character (@$!%*?&)", test: (password) => /[@$!%*?&]/.test(password) },
];

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const token = params.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const passwordMet = PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
    const confirmMatch = password === confirmPassword && confirmPassword.length > 0;
    const canSubmit = passwordMet && confirmMatch && !submitting;
    const fieldClassName = "auth-inp h-[44px] w-full pr-[42px]";

    async function handleSubmit() {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);

        try {
            await http.post("/auth/reset-password", { token, password, confirmPassword });
            setSuccess(true);
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

            {!token ? (
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-[56px] w-[56px] items-center justify-center rounded-full border border-[var(--iet-border)] bg-[var(--iet-red-pale)]">
                        <KeyRound size={24} className="text-[var(--iet-red)]" />
                    </div>
                    <div className="auth-h">Invalid Reset Link</div>
                    <p className="auth-sub mx-auto mt-[8px] max-w-[290px]">
                        This password reset link is missing or invalid. Please request a new one.
                    </p>
                    <Link
                        to="/auth/forgot-password"
                        className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--iet-red)] hover:underline"
                    >
                        Request New Reset Link
                        <ArrowRight size={13} />
                    </Link>
                </div>
            ) : success ? (
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-[56px] w-[56px] items-center justify-center rounded-full border border-green-100 bg-green-50">
                        <CheckCircle2 size={26} className="text-green-500" />
                    </div>
                    <div className="auth-h">Password Reset</div>
                    <p className="auth-sub mx-auto mt-[8px] max-w-[290px]">
                        Your password has been reset successfully. You can now sign in with your new password.
                    </p>
                    <Link
                        to="/auth/login"
                        className="mt-5 inline-flex items-center gap-2 rounded-[8px] bg-[var(--iet-red)] px-5 py-[11px] text-[13px] font-bold text-white transition hover:bg-[var(--iet-red-mid)]"
                    >
                        Sign In
                        <ArrowRight size={13} />
                    </Link>
                </div>
            ) : (
                <div>
                    <div className="auth-h text-center">Reset Password</div>
                    <p className="auth-sub mx-auto mt-[5px] max-w-[290px] text-center">
                        Choose a strong new password for your account.
                    </p>

                    <div className="mt-[22px]">
                        <div className="auth-group">
                            <label htmlFor="password" className="auth-lbl">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    placeholder="New password"
                                    onChange={(event) => setPassword(event.target.value)}
                                    className={fieldClassName}
                                    autoComplete="new-password"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[var(--iet-muted)] hover:text-[var(--iet-text)]"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <div className="auth-group">
                            <label htmlFor="confirm" className="auth-lbl">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    placeholder="Confirm new password"
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            void handleSubmit();
                                        }
                                    }}
                                    className={fieldClassName}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((value) => !value)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[var(--iet-muted)] hover:text-[var(--iet-text)]"
                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                >
                                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !confirmMatch ? (
                                <p className="mt-1 text-[11px] text-[var(--iet-red)]">Passwords do not match.</p>
                            ) : null}
                        </div>

                        {password.length > 0 ? (
                            <div className="mb-4 rounded-[8px] border border-[var(--iet-border)] bg-[var(--iet-bg)] px-3 py-2.5">
                                <p className="mb-1.5 text-[11px] font-semibold text-[var(--iet-text)]">
                                    Password requirements:
                                </p>
                                <ul className="space-y-1">
                                    {PASSWORD_REQUIREMENTS.map((requirement) => {
                                        const met = requirement.test(password);
                                        return (
                                            <li key={requirement.label} className="flex items-center gap-1.5">
                                                <CheckCircle2
                                                    size={12}
                                                    className={met ? "text-green-500" : "text-[var(--iet-border)]"}
                                                />
                                                <span className={`text-[11px] ${met ? "text-green-600" : "text-[var(--iet-muted)]"}`}>
                                                    {requirement.label}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ) : null}

                        {error ? (
                            <div className="mb-4 rounded-[10px] border border-[#f0b0b0] bg-[var(--iet-red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--iet-red)]">
                                {error}
                            </div>
                        ) : null}

                        <button
                            className="auth-btn-main flex w-full items-center justify-center gap-2"
                            type="button"
                            onClick={() => void handleSubmit()}
                            disabled={!canSubmit}
                        >
                            <span>{submitting ? "Resetting..." : "Reset Password"}</span>
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
