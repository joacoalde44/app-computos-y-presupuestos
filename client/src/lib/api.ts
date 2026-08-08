import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = api
            .post("/auth/refresh")
            .then((r) => {
              const token = r.data.accessToken as string;
              useAuthStore.getState().setAccessToken(token);
              return token;
            })
            .catch(() => {
              useAuthStore.getState().clear();
              return null;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const token = await refreshing;
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      } catch {
        // fall through to reject
      }
    }
    return Promise.reject(error);
  }
);
