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

/**
 * "Remember me" cookie + window. When set, auth cookies are written with a
 * Max-Age so the session survives the browser being closed; otherwise they are
 * session cookies that expire on browser close. 7 days matches the refresh
 * token lifetime (JWT_REFRESH_EXPIRATION), the longest a session can live.
 */
export const REMEMBER_KEY = "global-remember";
export const REMEMBER_DAYS = 7;

export const setToCookie = (key: string, value: string, maxAgeDays?: number): void => {
    if (typeof document === "undefined") return;
    const ttl = maxAgeDays && maxAgeDays > 0
        ? `Max-Age=${Math.round(maxAgeDays * 86400)}; `
        : "";
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; ${getSharedCookieDomain()}${ttl}SameSite=Strict`;
};

/** Record the user's "remember me" choice (persisted for the remember window). */
export const setRemember = (remember: boolean): void => {
    if (remember) setToCookie(REMEMBER_KEY, "1", REMEMBER_DAYS);
    else deleteFromCookie(REMEMBER_KEY);
};

/** Max-Age (days) to apply to auth cookies, or undefined for a session cookie. */
export const rememberDays = (): number | undefined =>
    getFromCookie(REMEMBER_KEY) === "1" ? REMEMBER_DAYS : undefined;

export const getFromCookie = (key: string): string | null => {
    if (typeof document === "undefined") return null;
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${key}=`));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
};

export const deleteFromCookie = (key: string): void | null => {
    if (typeof document === "undefined") return null;
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`;

    const sharedDomain = getSharedCookieDomain();
    if (sharedDomain) {
        document.cookie = `${key}=; path=/; ${sharedDomain}expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`;
    }
};
