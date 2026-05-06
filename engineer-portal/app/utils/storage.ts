export const setToStorage = <T>(key: string, value: T): void => {
    try {
        const serializedValue = typeof value === "string"
            ? value
            : JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
    } catch (error) {
        console.error(`Error storing item in local storage: ${error}`);
    }
};

export const getFromStorage = <T>(key: string): T | null => {
    try {
        const serializedValue = localStorage.getItem(key);
        if (serializedValue === null) return null;
        try {
            return JSON.parse(serializedValue) as T;
        } catch {
            return serializedValue as unknown as T;
        }
    } catch (error) {
        console.error(`Error retrieving item from local storage: ${error}`);
        return null;
    }
};

export const deleteFromStorage = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error deleting item from local storage: ${error}`);
    }
};

const getSharedCookieDomain = () => {
    if (typeof window === "undefined") return "";

    const hostname = window.location.hostname;
    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") return "";
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return "";
    if (hostname === "iet.or.tz" || hostname.endsWith(".iet.or.tz")) {
        return "domain=iet.or.tz; ";
    }

    return "";
};

export const setToCookie = (key: string, value: string): void => {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; ${getSharedCookieDomain()}SameSite=Strict`;
};

export const getFromCookie = (key: string): string | null => {
    if (typeof document === "undefined") return null;
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${key}=`));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
};

export const deleteFromCookie = (key: string): void | null => {
    if (typeof document === "undefined") return null;
    document.cookie = `${key}=; path=/; ${getSharedCookieDomain()}expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};
