import axios from "axios";
import { clearSession, TOKEN_KEY } from "~/utils/auth";
import { parseCookie } from "~/utils/cookies";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: {
    Accept: "application/json",
  },
});

let isRedirectingToLogin = false;

http.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const token = parseCookie(document.cookie, TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      if (typeof window !== "undefined" && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  },
);

export default http;
