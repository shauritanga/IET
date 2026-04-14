import type { AdminRole, LoginUser } from "~/types";
import { deleteCookie } from "~/utils/cookies";

export const TOKEN_KEY = "global-ut";
export const REFRESH_TOKEN_KEY = "global-rt";
export const ROLE_KEY = "portal-role";
export const USER_KEY = "admin-user";

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function getStoredUser(): LoginUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LoginUser;
  } catch {
    return null;
  }
}

export function persistSession(user: LoginUser, accessToken: string, refreshToken: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  setSessionCookies(accessToken, refreshToken, user.role ?? "");
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
}
