export function parseCookie(cookieHeader: string, key: string): string | null {
    const match = cookieHeader
        .split(";")
        .map((row) => row.trim())
        .find((row) => row.startsWith(`${key}=`));

    if (!match) return null;

    const value = match.slice(key.length + 1);
    return decodeURIComponent(value);
}

export function getCookieValue(request: Request, key: string): string | null {
    const requestCookie = request.headers.get("Cookie");

    if (requestCookie) {
        return parseCookie(requestCookie, key);
    }

    if (typeof document !== "undefined") {
        return parseCookie(document.cookie, key);
    }

    return null;
}
