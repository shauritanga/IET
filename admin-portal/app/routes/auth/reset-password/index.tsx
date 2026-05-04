import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { AxiosError } from "axios";
import http from "~/utils/http";

type Requirement = { label: string; test: (pw: string) => boolean };

const PASSWORD_REQUIREMENTS: Requirement[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter (a–z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number (0–9)", test: (pw) => /\d/.test(pw) },
  { label: "One special character (@$!%*?&)", test: (pw) => /[@$!%*?&]/.test(pw) },
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

  const passwordMet = PASSWORD_REQUIREMENTS.every((r) => r.test(password));
  const confirmMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = passwordMet && confirmMatch && !submitting;

  const fieldClassName =
    "h-[44px] w-full rounded-[8px] border border-[var(--border)] bg-white px-[13px] pr-[42px] text-[13px] text-[var(--text)] outline-none transition focus:border-[var(--red-dark)]";

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

  // No token in URL
  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[var(--red-pale)] border border-[#f0b0b0]">
          <KeyRound size={24} className="text-[var(--red)]" />
        </div>
        <h2 className="font-serif-display text-[22px] font-bold text-[var(--text)]">
          Invalid Reset Link
        </h2>
        <p className="mx-auto mt-[8px] max-w-[290px] text-[12px] leading-[1.7] text-[var(--muted)]">
          This password reset link is missing or invalid. Please request a new one.
        </p>
        <Link
          to="/auth/forgot-password"
          className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--red)] hover:underline"
        >
          Request New Reset Link
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-green-50 border border-green-100">
          <CheckCircle2 size={26} className="text-green-500" />
        </div>
        <h2 className="font-serif-display text-[22px] font-bold text-[var(--text)]">
          Password Reset
        </h2>
        <p className="mx-auto mt-[8px] max-w-[290px] text-[12px] leading-[1.7] text-[var(--muted)]">
          Your password has been reset successfully. You can now sign in with your new
          password.
        </p>
        <Link
          to="/auth/login"
          className="mt-5 inline-flex items-center gap-2 rounded-[8px] bg-[var(--red)] px-5 py-[11px] text-[13px] font-bold text-white transition hover:bg-[var(--red-mid)]"
        >
          Sign In
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif-display text-center text-[24px] font-bold text-[var(--text)]">
        Reset Password
      </h2>
      <p className="mx-auto mt-[5px] max-w-[290px] text-center text-[12px] leading-[1.6] text-[var(--muted)]">
        Choose a strong new password for your admin account.
      </p>

      <div className="mt-[22px]">
        {/* New Password */}
        <div className="mb-[14px]">
          <label htmlFor="password" className="mb-[6px] block text-[12.5px] font-semibold text-[var(--text)]">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="New password"
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClassName}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-[14px]">
          <label htmlFor="confirm" className="mb-[6px] block text-[12.5px] font-semibold text-[var(--text)]">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              placeholder="Confirm new password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              className={fieldClassName}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {confirmPassword.length > 0 && !confirmMatch && (
            <p className="mt-1 text-[11px] text-[var(--red)]">Passwords do not match.</p>
          )}
        </div>

        {/* Password requirements */}
        {password.length > 0 && (
          <div className="mb-4 rounded-[8px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-semibold text-[var(--text)]">Password requirements:</p>
            <ul className="space-y-1">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(password);
                return (
                  <li key={req.label} className="flex items-center gap-1.5">
                    <CheckCircle2
                      size={12}
                      className={met ? "text-green-500" : "text-[var(--border)]"}
                    />
                    <span className={`text-[11px] ${met ? "text-green-600" : "text-[var(--muted)]"}`}>
                      {req.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error ? (
          <div className="mb-4 rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
            {error}
          </div>
        ) : null}

        <button
          className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--red)] px-4 py-[13px] text-[13.5px] font-bold text-white transition hover:bg-[var(--red-mid)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)]"
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
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={12} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
