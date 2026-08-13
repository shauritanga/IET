import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
    setToStorage,
    getFromStorage,
    deleteFromStorage,
    setToCookie,
    deleteFromCookie,
    getFromCookie,
    REMEMBER_KEY,
} from "~/utils/storage";
import {
    createAuthSession,
    clearAuthSession,
    MEMBERSHIP_STATUS_COOKIE_KEY,
    REGISTRATION_STATUS_COOKIE_KEY,
    writeAuthSession,
} from "~/utils/otp-session";
import {TOKEN_KEY, USER_KEY} from "~/utils/http";
import type {User} from "~/routes/auth/types";

interface AuthContextType {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string, refreshToken?: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Log the user out after this long with no mouse/keyboard/touch/scroll activity.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 15 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const navigate = useNavigate();

    // Restore session on app load
    useEffect(() => {
        const storedToken = getFromCookie(TOKEN_KEY);
        const storedUser = getFromStorage<User>(USER_KEY);
        const storedRefreshToken = getFromCookie("global-rt");
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
            setRefreshToken(storedRefreshToken);
        }
        setIsLoading(false);
    }, []);

    // Called after OTP verification or login
    const setAuth = (user: User, token: string, refreshToken?: string) => {
        setToCookie(TOKEN_KEY, token);               // 👈 cookie instead of localStorage
        setToStorage(USER_KEY, user);                // user info stays in localStorage
        if (refreshToken) setToCookie("global-rt", refreshToken);
        setToCookie(MEMBERSHIP_STATUS_COOKIE_KEY, user.membershipStatus ?? "");
        setToCookie(REGISTRATION_STATUS_COOKIE_KEY, user.registrationStatus ?? "");
        setToken(token);
        setUser(user);
        setRefreshToken(refreshToken ?? null);
        writeAuthSession(createAuthSession({
            email: user.email,
            name: user.fullName ?? user.email,
            membershipStatus: user.membershipStatus,
            registrationStatus: user.registrationStatus,
        }));
    };

    const logout = () => {
        deleteFromCookie(TOKEN_KEY);
        deleteFromCookie("global-rt");
        deleteFromCookie(MEMBERSHIP_STATUS_COOKIE_KEY);
        deleteFromCookie(REGISTRATION_STATUS_COOKIE_KEY);
        deleteFromCookie(REMEMBER_KEY);
        deleteFromStorage(USER_KEY);
        clearAuthSession();
        setUser(null);
        setToken(null);
        setRefreshToken(null);
    };

    // Idle timeout: sign the user out after 15 minutes of no activity,
    // independent of token/session expiry.
    useEffect(() => {
        if (!token) return;

        let lastActivity = Date.now();
        const markActive = () => {
            lastActivity = Date.now();
        };

        ACTIVITY_EVENTS.forEach((event) =>
            window.addEventListener(event, markActive, { passive: true }),
        );

        const interval = setInterval(() => {
            if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
                logout();
                navigate("/auth/login", { replace: true });
            }
        }, IDLE_CHECK_INTERVAL_MS);

        return () => {
            ACTIVITY_EVENTS.forEach((event) =>
                window.removeEventListener(event, markActive),
            );
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            refreshToken,
            isAuthenticated: !!token,
            setAuth,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
