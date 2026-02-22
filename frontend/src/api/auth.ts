import http, { ACCESS_TOKEN_KEY } from "./http";
import type { Role, SupabaseAuthResponse, User } from "../types/auth";

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
  role?: Role,
): Promise<{ response: Response; data: SupabaseAuthResponse }> {
  const { url, anonKey } = assertSupabaseEnv();

  const response = await fetch(`${url}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
    },
    body: JSON.stringify({
      email,
      password,
      ...(role ? { data: { role } } : {}),
    }),
  });

  const data = (await response.json()) as SupabaseAuthResponse;
  return { response, data };
}

async function authenticateWithPassword(
  path: AuthPath,
  email: string,
  password: string,
  fallbackError: string,
  requireToken: boolean,
  role?: Role,
): Promise<string | null> {
  const { response, data } = await supabaseAuthRequest(path, email, password, role);

  if (!response.ok || (requireToken && !data.access_token)) {
    throw new Error(data.error_description || data.msg || fallbackError);
  }

  return data.access_token ?? null;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<string> {
  const token = await authenticateWithPassword(
    "/auth/v1/token?grant_type=password",
    email,
    password,
    "Supabase login failed",
    true,
  );
  if (!token) {
    throw new Error("Supabase login failed");
  }
  return token;
}

export async function signupWithEmailPassword(
  email: string,
  password: string,
  role: Role,
): Promise<string | null> {
  return authenticateWithPassword(
    "/auth/v1/signup",
    email,
    password,
    "Supabase signup failed",
    false,
    role,
  );
}

export async function registerCurrentUserRole(role: Role): Promise<void> {
  await http.post("/auth/role", { role });
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
