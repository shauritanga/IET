import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, redirect, useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
import type { AxiosError } from "axios";
import type { ApiEnvelope, TwoFactorValidationResponse } from "~/types";
import { getCookieValue } from "~/utils/cookies";
import {
  clearPendingTwoFactor,
  clearSession,
  getPendingTwoFactor,
  isAdminRole,
  PENDING_2FA_KEY,
  persistSession,
  ROLE_KEY,
  TOKEN_KEY,
} from "~/utils/auth";
import http from "~/utils/http";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const token = getCookieValue(request, TOKEN_KEY);
  const role = getCookieValue(request, ROLE_KEY);
  const pendingOtp = getCookieValue(request, PENDING_2FA_KEY);

  if (token && isAdminRole(role)) {
    return redirect("/dashboard");
  }

  if (!pendingOtp) {
    return redirect("/auth/login");
  }

  try {
    const parsed = JSON.parse(pendingOtp) as { email?: string };
    if (!parsed.email) {
      return redirect("/auth/login");
    }
    return { pendingEmail: parsed.email };
  } catch {
    return redirect("/auth/login");
  }
};

export default function OtpPage() {
  const { pendingEmail } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [values, setValues] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const valuesRef = useRef(values);
  const submittingRef = useRef(submitting);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const code = values.join("");

  function updateValue(index: number, next: string) {
    const digit = next.replace(/\D/g, "").slice(-1);
    const nextValues = [...valuesRef.current];
    nextValues[index] = digit;
    valuesRef.current = nextValues;
    setValues(nextValues);
    setError(null);

    if (digit && index < refs.current.length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handleKeyUp(index: number) {
    if (index !== refs.current.length - 1) return;
    if (submittingRef.current) return;

    const currentValues = valuesRef.current;

    if (currentValues.every(Boolean)) {
      void handleVerify(currentValues.join(""));
    }
  }

  async function handleVerify(candidateCode = valuesRef.current.join("")) {
    if (submittingRef.current) return;

    const pendingSession = getPendingTwoFactor();
    if (!pendingSession?.userId) {
      clearSession();
      navigate("/auth/login", { replace: true });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await http.post<ApiEnvelope<TwoFactorValidationResponse>>("/auth/2fa/validate", {
        userId: pendingSession.userId,
        token: candidateCode,
      });

      const result = response.data.data;

      if (!result.verified || !result.accessToken || !result.refreshToken || !result.user) {
        setError("Invalid security code.");
        return;
      }

      if (!isAdminRole(result.user.role)) {
        setError("This account does not have admin portal access.");
        return;
      }

      persistSession(result.user, result.accessToken, result.refreshToken);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setError(apiError.response?.data?.message ?? "Verification request did not reach the backend.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mx-auto mb-[14px] flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-[rgba(226,12,10,0.2)] bg-[var(--red-pale)]">
        <Lock size={22} className="text-[var(--red)]" />
      </div>
      <div className="font-serif-display text-center text-[24px] font-bold text-[var(--text)]">
        Two-Factor Authentication
      </div>
      <div className="mt-[5px] text-center text-[12px] leading-[1.6] text-[var(--muted)]">
        A 6-digit code has been sent to your registered phone number.
        <br />
        Signing in as <strong className="text-[var(--red-dark)]">{pendingEmail}</strong>
      </div>

      <div className="my-[18px] flex justify-center gap-[10px]">
        {values.map((value, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={value}
            maxLength={1}
            inputMode="numeric"
            onChange={(event) => updateValue(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onKeyUp={() => handleKeyUp(index)}
            className="otp-slot h-[54px] w-12 rounded-[10px] border-[1.5px] border-[var(--border)] bg-white text-center font-serif-display text-[22px] font-extrabold text-[var(--red-dark)] outline-none transition focus:border-[var(--red-dark)] focus:shadow-[0_0_0_3px_rgba(226,12,10,0.1)]"
          />
        ))}
      </div>

      {error ? (
        <div className="mb-[10px] text-center text-[11px] font-semibold text-[var(--red)]">{error}</div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleVerify(code)}
        disabled={submitting || code.length < 6}
        className="mx-auto flex w-full max-w-[280px] items-center justify-center gap-2 rounded-[8px] bg-[var(--red)] px-4 py-[13px] text-[13.5px] font-bold text-white transition hover:bg-[var(--red-mid)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)]"
      >
        <Lock size={14} />
        <span>{submitting ? "Verifying..." : "Verify & Enter Admin Portal"}</span>
      </button>

      <div className="mt-[14px] text-center text-[12px] text-[var(--muted)]">
        Didn't receive the code? Check your phone or go back and try again.
      </div>
      <div className="mt-2 text-center text-[12px] text-[var(--muted)]">
        <Link
          to="/auth/login"
          className="font-bold text-[var(--red)]"
          onClick={() => {
            clearPendingTwoFactor();
          }}
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
