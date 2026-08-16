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
  setPendingTwoFactor,
  TOKEN_KEY,
  type PendingTwoFactorSession,
} from "~/utils/auth";
import http from "~/utils/http";

type LoginOtpChannel = "sms" | "email";

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
    const parsed = JSON.parse(pendingOtp) as PendingTwoFactorSession;
    if (!parsed.email || !parsed.userId) {
      return redirect("/auth/login");
    }
    return {
      pendingEmail: parsed.email,
      userId: parsed.userId,
      smsDestination: parsed.smsDestination,
      emailDestination: parsed.emailDestination,
      channel: (parsed.channel ?? "sms") as LoginOtpChannel,
    };
  } catch {
    return redirect("/auth/login");
  }
};

function maskEmail(email: string) {
  const [localPart, domain = ""] = email.split("@");
  if (!localPart) return email;
  const start = localPart.slice(0, 2);
  return `${start}${"*".repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
}

export default function OtpPage() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [values, setValues] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const [channel, setChannel] = useState<LoginOtpChannel>(loaderData.channel);
  const [smsDestination, setSmsDestination] = useState(loaderData.smsDestination);
  const [emailDestination, setEmailDestination] = useState(
    loaderData.emailDestination ?? maskEmail(loaderData.pendingEmail),
  );
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
  const destination =
    channel === "email"
      ? emailDestination
      : smsDestination ?? "your registered phone number";

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

  async function handleSendOtp(nextChannel: LoginOtpChannel) {
    if (nextChannel === channel && seconds > 0) return;

    setResending(true);
    setError(null);
    setInfo(null);

    try {
      const response = await http.post<
        ApiEnvelope<{ channel: LoginOtpChannel; destination: string; message: string }>
      >("/auth/2fa/resend", {
        userId: loaderData.userId,
        channel: nextChannel,
      });

      const result = response.data.data;
      setChannel(result.channel);
      if (result.channel === "sms") setSmsDestination(result.destination);
      if (result.channel === "email") setEmailDestination(result.destination);
      setPendingTwoFactor({
        userId: loaderData.userId,
        email: loaderData.pendingEmail,
        smsDestination: result.channel === "sms" ? result.destination : smsDestination,
        emailDestination: result.channel === "email" ? result.destination : emailDestination,
        channel: result.channel,
      });
      setValues(["", "", "", "", "", ""]);
      setInfo(result.message);
      setSeconds(45);
      refs.current[0]?.focus();
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setError(apiError.response?.data?.message ?? "Failed to send login code.");
    } finally {
      setResending(false);
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
        A 6-digit code has been sent by {channel === "email" ? "email" : "SMS"} to{" "}
        <strong className="text-[var(--red-dark)]">{destination}</strong>.
        <br />
        Signing in as <strong className="text-[var(--red-dark)]">{loaderData.pendingEmail}</strong>
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

      {info ? (
        <div className="mb-[10px] text-center text-[11px] font-semibold text-[#1a6b3c]">{info}</div>
      ) : null}

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

      <div className="mt-[14px] text-center text-[12px] leading-[1.7] text-[var(--muted)]">
        <div>
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            disabled={resending || seconds > 0}
            onClick={() => void handleSendOtp(channel)}
            className="font-bold text-[var(--red)] disabled:cursor-not-allowed disabled:text-[var(--muted)]"
          >
            {resending ? "Sending..." : `Resend via ${channel === "email" ? "email" : "SMS"}`}
          </button>
          {seconds > 0 ? <span className="text-[11px]"> ({seconds}s)</span> : null}
        </div>
        <div className="mt-2">
          {channel === "sms" ? (
            <>
              Prefer email?{" "}
              <button
                type="button"
                disabled={resending}
                onClick={() => void handleSendOtp("email")}
                className="font-bold text-[var(--red)] disabled:cursor-not-allowed disabled:text-[var(--muted)]"
              >
                Send code to email
              </button>
            </>
          ) : (
            <>
              Prefer SMS?{" "}
              <button
                type="button"
                disabled={resending}
                onClick={() => void handleSendOtp("sms")}
                className="font-bold text-[var(--red)] disabled:cursor-not-allowed disabled:text-[var(--muted)]"
              >
                Send code by SMS
              </button>
            </>
          )}
        </div>
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
