import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { deleteFromCookie, deleteFromStorage, getFromCookie, rememberDays, setToCookie } from "~/utils/storage";
import {
    clearAuthSession,
    MEMBERSHIP_STATUS_COOKIE_KEY,
    REGISTRATION_STATUS_COOKIE_KEY,
} from "~/utils/otp-session";

export const TOKEN_KEY = "global-ut";
export const REFRESH_TOKEN_KEY = "global-rt";
export const USER_KEY = "global-uid";

type RefreshTokenResponse = {
    data?: {
        accessToken?: string;
        refreshToken?: string;
    };
};

let isRedirectingToLogin = false;

const clearAuthAndRedirect = () => {
    deleteFromCookie(TOKEN_KEY);
    deleteFromCookie(REFRESH_TOKEN_KEY);
    deleteFromCookie(MEMBERSHIP_STATUS_COOKIE_KEY);
    deleteFromCookie(REGISTRATION_STATUS_COOKIE_KEY);
    deleteFromStorage(TOKEN_KEY);
    deleteFromStorage(USER_KEY);
    clearAuthSession();
    if (typeof window === "undefined" || isRedirectingToLogin) return;
    isRedirectingToLogin = true;
    window.location.href = "/auth/login";
};

const createAxiosInstance = (config: AxiosRequestConfig = {}): AxiosInstance => {
    const instance = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
        headers: { Accept: "application/json" },
        withCredentials: false,
        ...config,
    });

    let isRefreshing = false;
    let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

    const processQueue = (error: unknown, token: string | null) => {
        failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
        failedQueue = [];
    };

    instance.interceptors.request.use((config) => {
        const token = getFromCookie(TOKEN_KEY);
        if (token) config.headers["Authorization"] = `Bearer ${token}`;
        return config;
    });

    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (error.response?.status !== 401) {
                return Promise.reject(error);
            }

            if (!originalRequest || originalRequest._retry) {
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            const refreshToken = getFromCookie(REFRESH_TOKEN_KEY);
            if (!refreshToken) {
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers["Authorization"] = `Bearer ${token}`;
                    return instance(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post<RefreshTokenResponse>(
                    `${import.meta.env.VITE_API_BASE_URL || "/api/v1"}/auth/refresh`,
                    { refreshToken },
                );

                const nextAccessToken = response.data.data?.accessToken;
                const nextRefreshToken = response.data.data?.refreshToken;

                if (!nextAccessToken || !nextRefreshToken) {
                    throw new Error("Malformed refresh token response");
                }

                const rememberTtl = rememberDays();
                setToCookie(TOKEN_KEY, nextAccessToken, rememberTtl);
                setToCookie(REFRESH_TOKEN_KEY, nextRefreshToken, rememberTtl);
                instance.defaults.headers.common["Authorization"] = `Bearer ${nextAccessToken}`;
                processQueue(null, nextAccessToken);
                originalRequest.headers["Authorization"] = `Bearer ${nextAccessToken}`;
                return instance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAuthAndRedirect();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        },
    );

    return instance;
};

const http = createAxiosInstance();
export default http;
