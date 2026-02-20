import http, { ACCESS_TOKEN_KEY } from "./http";
import type { SupabaseAuthResponse, User } from "../types/auth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type AuthPath = "/auth/v1/token?grant_type=password" | "/auth/v1/signup";

function assertSupabaseEnv(): { url: string; anonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in frontend/.env");
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

async function supabaseAuthRequest(
  path: AuthPath,
  email: string,
  password: string,
): Promise<{ response: Response; data: SupabaseAuthResponse }> {
  const { url, anonKey } = assertSupabaseEnv();

  const response = await fetch(`${url}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json()) as SupabaseAuthResponse;
  return { response, data };
}

export async function loginWithEmailPassword(email: string, password: string): Promise<string> {
  const { response, data } = await supabaseAuthRequest(
    "/auth/v1/token?grant_type=password",
    email,
    password,
  );

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.msg || "Supabase login failed");
  }

  return data.access_token;
}

export async function signupWithEmailPassword(
  email: string,
  password: string,
): Promise<string | null> {
  const { response, data } = await supabaseAuthRequest("/auth/v1/signup", email, password);

  if (!response.ok) {
    throw new Error(data.error_description || data.msg || "Supabase signup failed");
  }

  return data.access_token ?? null;
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await http.get<User>("/auth/me");
  return response.data;
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeAccessToken(accessToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearStoredAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
