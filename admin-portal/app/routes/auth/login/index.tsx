import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, redirect, useNavigate, type LoaderFunctionArgs } from "react-router";
import type { AxiosError } from "axios";
import type { ApiEnvelope, AuthResponse } from "~/types";
import { getCookieValue } from "~/utils/cookies";
import {
  clearSession,
  getStoredUser,
  isAdminRole,
  ROLE_KEY,
  persistSession,
  setPendingTwoFactor,
  TOKEN_KEY,
} from "~/utils/auth";
import http from "~/utils/http";

const PORTAL = "ADMIN_PORTAL";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const token = getCookieValue(request, TOKEN_KEY);
  const role = getCookieValue(request, ROLE_KEY);

  if (token && isAdminRole(role)) {
    return redirect("/dashboard");
  }

  return null;
};

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user && isAdminRole(user.role)) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const fieldClassName =
    "h-[44px] w-full rounded-[8px] border border-[var(--border)] bg-white px-[13px] text-[13px] text-[var(--text)] outline-none transition focus:border-[var(--red-dark)]";

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    clearSession();

    try {
      const response = await http.post<ApiEnvelope<AuthResponse>>("/auth/login", {
        email: email.trim(),
        password,
        portal: PORTAL,
      });

      const result = response.data.data;

      if ("validate2FA" in result) {
        setPendingTwoFactor({
          userId: result.validate2FA,
          email: email.trim(),
        });
        navigate("/auth/otp", { replace: true });
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
      setError(apiError.response?.data?.message ?? "Login request did not reach the backend.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-serif-display text-center text-[24px] font-bold text-[var(--text)]">
        Log In
      </h2>
      <p className="mx-auto mt-[5px] max-w-[290px] text-center text-[12px] leading-[1.6] text-[var(--muted)]">
        Please enter your registered email and password below to sign in.
      </p>

      <div className="mt-[22px]">
        <div className="mb-[14px]">
          <label htmlFor="email" className="mb-[6px] block text-[12.5px] font-semibold text-[var(--text)]">
            Email
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
            required
          />
        </div>

        <div className="mb-[14px]">
          <label htmlFor="password" className="mb-[6px] block text-[12.5px] font-semibold text-[var(--text)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="Password"
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            className={fieldClassName}
            required
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2 text-[12px] text-[var(--muted)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-[14px] w-[14px] accent-[#4f0f0c]"
            />
            <span>Remember me</span>
          </label>
          <Link to="/auth/forgot-password" className="text-[12px] font-semibold text-[var(--red)] hover:underline">
            Forgot Password?
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
            {error}
          </div>
        ) : null}

        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--red)] px-4 py-[13px] text-[13.5px] font-bold text-white transition hover:bg-[var(--red-mid)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)]"
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
        >
          <span>{submitting ? "Signing In..." : "Sign In"}</span>
          {!submitting ? <ArrowRight size={14} /> : null}
        </button>
      </div>
    </div>
  );
}
