import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { deleteFromCookie, deleteFromStorage, getFromCookie, setToCookie } from "~/utils/storage";
import { MEMBERSHIP_STATUS_COOKIE_KEY, REGISTRATION_STATUS_COOKIE_KEY } from "~/utils/otp-session";

export const TOKEN_KEY = "global-ut";
export const REFRESH_TOKEN_KEY = "global-rt";
export const USER_KEY = "global-uid";

const clearAuthAndRedirect = () => {
    deleteFromCookie(TOKEN_KEY);
    deleteFromCookie(REFRESH_TOKEN_KEY);
    deleteFromCookie(MEMBERSHIP_STATUS_COOKIE_KEY);
    deleteFromCookie(REGISTRATION_STATUS_COOKIE_KEY);
    deleteFromStorage(TOKEN_KEY);
    deleteFromStorage(USER_KEY);
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

            if (error.response?.status !== 401 || originalRequest._retry) {
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
                const { data } = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL || "/api/v1"}/auth/refresh`,
                    { refreshToken },
                );
                setToCookie(TOKEN_KEY, data.accessToken);
                setToCookie(REFRESH_TOKEN_KEY, data.refreshToken);
                instance.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;
                processQueue(null, data.accessToken);
                originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
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
