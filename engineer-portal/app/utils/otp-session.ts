export const AUTH_STORAGE_KEY = "iet-demo-auth";
export const OTP_SESSION_KEY = "iet-demo-otp-session";

export type OtpFlow = "email-verification" | "login-2fa";

export type OtpSession = {
    flow: OtpFlow;
    email: string;
    name: string;
    userId?: string;
    createdAt: number;
};

export type AuthSession = {
    email: string;
    name: string;
    showMembershipPrompt?: boolean;
};

export type AuthSessionSource = {
    email: string;
    name: string;
    membershipStatus?: string | null;
};

export function normalizePhoneNumber(value: string) {
    return value.replace(/[\s()-]/g, "").trim();
}

export function createOtpSession(payload: {
    flow: OtpFlow;
    email: string;
    name: string;
    userId?: string;
}) {
    const session: OtpSession = {
        flow: payload.flow,
        email: payload.email.trim(),
        name: payload.name.trim(),
        userId: payload.userId,
        createdAt: Date.now(),
    };

    if (typeof window !== "undefined") {
        window.sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));
    }

    return session;
}

export function readOtpSession(): OtpSession | null {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(OTP_SESSION_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as OtpSession;
    } catch {
        return null;
    }
}

export function writeOtpSession(session: OtpSession) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));
}

export function clearOtpSession() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(OTP_SESSION_KEY);
}

export function writeAuthSession(session: AuthSession) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function createAuthSession(payload: AuthSessionSource): AuthSession {
    return {
        email: payload.email.trim(),
        name: payload.name.trim(),
        showMembershipPrompt: (payload.membershipStatus ?? "").toUpperCase() !== "ACTIVE",
    };
}

export function readAuthSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as AuthSession;
    } catch {
        return null;
    }
}

export function clearAuthSession() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}
