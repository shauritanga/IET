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

export function setCookie(key: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
}

export function deleteCookie(key: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
