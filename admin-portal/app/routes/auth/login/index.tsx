import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import type { AxiosError } from "axios";
import http from "~/utils/http";
import { clearSession, getStoredUser, isAdminRole, persistSession } from "~/utils/auth";
import type { ApiEnvelope, LoginResponse } from "~/types";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@iet.or.tz");
  const [password, setPassword] = useState("Admin@123!");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user && isAdminRole(user.role)) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await http.post<ApiEnvelope<LoginResponse>>("/auth/login", {
        email,
        password,
      });

      const payload = response.data.data;

      if (!isAdminRole(payload.user.role)) {
        clearSession();
        setError("This account is valid, but it is not allowed to use the admin portal.");
        return;
      }

      persistSession(payload.user, payload.accessToken, payload.refreshToken);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-form-wrap">
      <h2 className="auth-title">Log In</h2>
      <p className="auth-subtitle auth-centered">
        Pease enter your registered email and password below to Sign in.
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            placeholder="example@gmail.com"
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="Password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div className="auth-form-row">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me for 30 days</span>
          </label>
          <a href="#" className="forgot-link">Forgot Password?</a>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Signing In..." : "Sign In"}
        </button>

        <p className="auth-register-copy">
          Dont have an account? <a href="#" className="register-link">Click here to register</a>
        </p>
      </form>
    </div>
  );
}
