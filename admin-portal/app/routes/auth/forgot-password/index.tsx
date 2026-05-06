import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { AxiosError } from "axios";
import http from "~/utils/http";

const PORTAL = "ADMIN_PORTAL";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const fieldClassName =
    "h-[44px] w-full rounded-[8px] border border-[var(--border)] bg-white px-[13px] text-[13px] text-[var(--text)] outline-none transition focus:border-[var(--red-dark)]";

  async function handleSubmit() {
    if (submitting || !email.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      await http.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
        portal: PORTAL,
      });
      setSent(true);
    } catch (err) {
      const apiError = err as AxiosError<{ message?: string }>;
      // Show generic error only for network failures; backend always returns 200
      setError(apiError.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-green-50 border border-green-100">
          <CheckCircle2 size={26} className="text-green-500" />
        </div>
        <h2 className="font-serif-display text-[22px] font-bold text-[var(--text)]">
          Check Your Email
        </h2>
        <p className="mx-auto mt-[8px] max-w-[300px] text-[12px] leading-[1.7] text-[var(--muted)]">
          If <span className="font-semibold text-[var(--text)]">{email}</span> is
          registered, you'll receive a password reset link shortly. Check your spam
          folder if it doesn't arrive within a few minutes.
        </p>
        <Link
          to="/auth/login"
          className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--red)] hover:underline"
        >
          <ArrowLeft size={13} />
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto mb-5 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[var(--red-pale)] border border-[#f0b0b0]">
        <Mail size={20} className="text-[var(--red)]" />
      </div>

      <h2 className="font-serif-display text-center text-[24px] font-bold text-[var(--text)]">
        Forgot Password?
      </h2>
      <p className="mx-auto mt-[5px] max-w-[290px] text-center text-[12px] leading-[1.6] text-[var(--muted)]">
        Enter your registered email address and we'll send you a link to reset your
        password.
      </p>

      <div className="mt-[22px]">
        <div className="mb-[14px]">
          <label htmlFor="email" className="mb-[6px] block text-[12.5px] font-semibold text-[var(--text)]">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            placeholder="example@gmail.com"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            className={fieldClassName}
            autoComplete="email"
            autoFocus
          />
        </div>

        {error ? (
          <div className="mb-4 rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
            {error}
          </div>
        ) : null}

        <button
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--red)] px-4 py-[13px] text-[13.5px] font-bold text-white transition hover:bg-[var(--red-mid)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)]"
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
