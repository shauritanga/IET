import type { AdminRole, LoginUser } from "~/types";
import { deleteCookie, parseCookie, setCookie } from "~/utils/cookies";

export const TOKEN_KEY = "global-ut";
export const REFRESH_TOKEN_KEY = "global-rt";
export const ROLE_KEY = "portal-role";
export const USER_KEY = "admin-user";
export const PENDING_2FA_KEY = "admin-pending-2fa";
export const REMEMBER_KEY = "admin-remember";

// 7 days matches the refresh token lifetime (JWT_REFRESH_EXPIRATION) — the
// longest a session can be kept alive.
export const REMEMBER_DAYS = 7;

/** Record the user's "remember me" choice (persisted for the remember window). */
export function setRemember(remember: boolean) {
  if (remember) setCookie(REMEMBER_KEY, "1", REMEMBER_DAYS);
  else deleteCookie(REMEMBER_KEY);
}

/** Max-Age (days) to apply to auth cookies, or undefined for a session cookie. */
export function rememberDays(): number | undefined {
  if (typeof document === "undefined") return undefined;
  return parseCookie(document.cookie, REMEMBER_KEY) === "1" ? REMEMBER_DAYS : undefined;
}

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return [
    "ADMIN",
    "SUPER_ADMIN",
    "SECRETARIAT",
    "EVALUATOR",
    "MPDC",
    "COUNCIL",
    "REVIEWER",
  ].includes(role ?? "");
}

export function getStoredUser(): LoginUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);

  if (raw) {
    try {
      return JSON.parse(raw) as LoginUser;
    } catch {
      window.localStorage.removeItem(USER_KEY);
    }
  }

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${USER_KEY}=`));

  if (!match) return null;

  try {
    return JSON.parse(decodeURIComponent(match.slice(USER_KEY.length + 1))) as LoginUser;
  } catch {
    return null;
  }
}

export function persistSession(
  user: LoginUser,
  accessToken: string,
  refreshToken: string,
  remember?: boolean,
) {
  // Only touch the remember flag when explicitly provided, so the OTP-completion
  // path (which omits it) preserves the choice made on the login screen.
  if (remember !== undefined) setRemember(remember);
  const days = rememberDays();

  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  setSessionCookies(accessToken, refreshToken, user.role ?? "", days);
  setCookie(USER_KEY, JSON.stringify(user), days);
  clearPendingTwoFactor();
}

export function setSessionCookies(
  accessToken: string,
  refreshToken: string,
  role: string,
  maxAgeDays?: number,
) {
  setCookie(TOKEN_KEY, accessToken, maxAgeDays);
  setCookie(REFRESH_TOKEN_KEY, refreshToken, maxAgeDays);
  setCookie(ROLE_KEY, role, maxAgeDays);
}

export function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_KEY);
  }

  deleteCookie(TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
  deleteCookie(ROLE_KEY);
  deleteCookie(USER_KEY);
  deleteCookie(REMEMBER_KEY);
  clearPendingTwoFactor();
}

export type PendingTwoFactorSession = {
  userId: string;
  email: string;
};

export function setPendingTwoFactor(session: PendingTwoFactorSession) {
  setCookie(PENDING_2FA_KEY, JSON.stringify(session));
}

export function getPendingTwoFactor(): PendingTwoFactorSession | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PENDING_2FA_KEY}=`));

  if (!match) return null;

  try {
    return JSON.parse(decodeURIComponent(match.slice(PENDING_2FA_KEY.length + 1))) as PendingTwoFactorSession;
  } catch {
    return null;
  }
}

export function clearPendingTwoFactor() {
  deleteCookie(PENDING_2FA_KEY);
}
