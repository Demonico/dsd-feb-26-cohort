import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const ACCESS_TOKEN_KEY = "sb_access_token";

const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY);

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

export default http;
