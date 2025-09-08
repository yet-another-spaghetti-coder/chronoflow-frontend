import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/auth-store";
import { refresh } from "@/api/authApi";

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

export const http = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

const isLoginPath = (url?: string) => {
  if (!url) return false;
  const p = url.startsWith("http") ? new URL(url).pathname : url;
  return /^\/system\/auth\/login(\/|$)/.test(p);
};

http.interceptors.request.use((config) => {
  if (!isLoginPath(config.url)) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers = config.headers ?? {};
      (
        config.headers as Record<string, string>
      ).Authentication = `Bearer ${token}`;
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const response = error.response;
    const config = (error.config || {}) as RetriableConfig;

    if (!response || response.status !== 401 || config._retry) {
      return Promise.reject(error);
    }

    if (isLoginPath(config.url)) {
      useAuthStore.getState().clear();
      return Promise.reject(error);
    }

    config._retry = true;

    const ok = await refresh();
    
    if (!ok) {
      useAuthStore.getState().clear();
      return Promise.reject(error);
    }

    const newToken = useAuthStore.getState().accessToken;
    config.headers = config.headers ?? {};

    if (newToken) {
      (
        config.headers as Record<string, string>
      ).Authentication = `Bearer ${newToken}`;
    }

    return http(config);
  }
);
