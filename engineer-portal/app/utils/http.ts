import axios, {type AxiosInstance, type AxiosRequestConfig } from "axios";
import {deleteFromCookie, deleteFromStorage, getFromCookie, getFromStorage} from "~/utils/storage";

export const TOKEN_KEY = "global-ut";
export const USER_KEY = "global-uid";

const createAxiosInstance = (
    config: AxiosRequestConfig = {}
): AxiosInstance => {
    const defaultConfig: Record<string, any> = {
        ...config,
        headers: {
            Accept: "application/json",
        },
        withCredentials: false,
    };

    const instance = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
        ...defaultConfig,
    });

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (false && error.response?.status === 401) {
                deleteFromStorage(TOKEN_KEY);
                deleteFromStorage(USER_KEY);
                deleteFromCookie(TOKEN_KEY);
                deleteFromCookie("global-ms");
                window.location.href = "/auth/login";
            }
            return Promise.reject(error);
        }
    );

    instance.interceptors.request.use((config) => {
        const token = getFromCookie(TOKEN_KEY);
        if (token) config.headers["Authorization"] = `Bearer ${token}`;
        return config;
    });

    // instance.interceptors.request.use(
    //     (config) => {
    //         const token = getFromStorage<string>(TOKEN_KEY);
    //
    //         if (token !== null)
    //             config.headers["Authorization"] = `Bearer ${token}`;
    //         return config;
    //     },
    //     (error) => {
    //         return Promise.reject(error);
    //     }
    // );

    return instance;
};

const http = createAxiosInstance();

export default http;
