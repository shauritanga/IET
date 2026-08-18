import axios from "axios";
import {
  clearSession,
  rememberDays,
  REFRESH_TOKEN_KEY,
  setSessionCookies,
  ROLE_KEY,
  TOKEN_KEY,
} from "~/utils/auth";
import { parseCookie } from "~/utils/cookies";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const http = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});

let isRedirectingToLogin = false;

function forceLogin() {
  clearSession();
  if (typeof window !== "undefined" && !isRedirectingToLogin) {
    isRedirectingToLogin = true;
    window.location.href = "/auth/login";
  }
}

http.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const token = parseCookie(document.cookie, TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Single-flight refresh: queue concurrent 401s while one refresh is in flight.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  failedQueue = [];
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      forceLogin();
      return Promise.reject(error);
    }

    const refreshToken =
      typeof document !== "undefined"
        ? parseCookie(document.cookie, REFRESH_TOKEN_KEY)
        : null;
    if (!refreshToken) {
      forceLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return http(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<{
        data?: { accessToken?: string; refreshToken?: string };
      }>(`${baseURL}/auth/refresh`, { refreshToken });

      const nextAccessToken = response.data.data?.accessToken;
      const nextRefreshToken = response.data.data?.refreshToken;
      if (!nextAccessToken || !nextRefreshToken) {
        throw new Error("Malformed refresh token response");
      }

      const role =
        (typeof document !== "undefined"
          ? parseCookie(document.cookie, ROLE_KEY)
          : "") ?? "";
      setSessionCookies(nextAccessToken, nextRefreshToken, role, rememberDays());

      http.defaults.headers.common.Authorization = `Bearer ${nextAccessToken}`;
      processQueue(null, nextAccessToken);
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export interface ApiErrorPayload {
  message?: string;
  errors?:
    | Array<{ property?: string; message?: string; constraints?: string[] } | string>
    | null;
}

/**
 * Extract a human-readable message from an API error response. The backend's
 * ValidationPipe always sets `message` to the generic "Validation failed" for
 * DTO errors and puts the actual per-field problems in `errors` — so callers
 * must read `errors` first or the user only ever sees "Validation failed"
 * with no indication of which field or why.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: ApiErrorPayload } })?.response?.data;
  if (!data) return fallback;

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const parts = data.errors
      .map((e) => (typeof e === "string" ? e : e?.message))
      .filter((m): m is string => Boolean(m));
    if (parts.length > 0) return parts.join("; ");
  }

  return data.message ?? fallback;
}

export default http;
