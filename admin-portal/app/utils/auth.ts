import type { AdminRole, LoginUser } from "~/types";
import { deleteCookie, setCookie } from "~/utils/cookies";

export const TOKEN_KEY = "global-ut";
export const REFRESH_TOKEN_KEY = "global-rt";
export const ROLE_KEY = "portal-role";
export const USER_KEY = "admin-user";
export const PENDING_2FA_KEY = "admin-pending-2fa";

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

export function persistSession(user: LoginUser, accessToken: string, refreshToken: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  setSessionCookies(accessToken, refreshToken, user.role ?? "");
  setCookie(USER_KEY, JSON.stringify(user));
  clearPendingTwoFactor();
}

export function setSessionCookies(accessToken: string, refreshToken: string, role: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(accessToken)}; path=/; SameSite=Strict`;
  document.cookie = `${REFRESH_TOKEN_KEY}=${encodeURIComponent(refreshToken)}; path=/; SameSite=Strict`;
  document.cookie = `${ROLE_KEY}=${encodeURIComponent(role)}; path=/; SameSite=Strict`;
}

export function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_KEY);
  }

  deleteCookie(TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
  deleteCookie(ROLE_KEY);
  deleteCookie(USER_KEY);
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
