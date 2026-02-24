import { ACCESS_TOKEN_KEY, API_BASE } from "./http";

export async function apiFetch(path: string, options?: RequestInit) {
  const token =
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY);

  const headers = new Headers((options?.headers as HeadersInit) || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  return res;
}
