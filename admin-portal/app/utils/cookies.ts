export function parseCookie(cookieHeader: string, key: string): string | null {
  const match = cookieHeader
    .split(";")
    .map((row) => row.trim())
    .find((row) => row.startsWith(`${key}=`));

  if (!match) return null;

  return decodeURIComponent(match.slice(key.length + 1));
}

export function getCookieValue(request: Request, key: string): string | null {
  const cookieHeader = request.headers.get("Cookie");

  if (cookieHeader) {
    return parseCookie(cookieHeader, key);
  }

  if (typeof document !== "undefined") {
    return parseCookie(document.cookie, key);
  }

  return null;
}

function getSharedCookieDomain() {
  if (typeof window === "undefined") return "";

  const hostname = window.location.hostname;
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") return "";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return "";
  if (hostname === "iet.or.tz" || hostname.endsWith(".iet.or.tz")) {
    return "domain=iet.or.tz; ";
  }

  return "";
}

export function setCookie(key: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; ${getSharedCookieDomain()}SameSite=Strict`;
}

export function deleteCookie(key: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=; path=/; ${getSharedCookieDomain()}expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
