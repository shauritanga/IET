import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
    setToStorage,
    getFromStorage,
    deleteFromStorage,
    setToCookie,
    deleteFromCookie,
    getFromCookie
} from "~/utils/storage";
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);

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
        setToCookie("global-ms", user.membershipStatus);
        setToken(token);
        setUser(user);
        setRefreshToken(refreshToken ?? null);
    };

    const logout = () => {
        deleteFromCookie(TOKEN_KEY);
        deleteFromCookie("global-rt");
        deleteFromStorage(USER_KEY);
        setUser(null);
        setToken(null);
        setRefreshToken(null);
    };

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