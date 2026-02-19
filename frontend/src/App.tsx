import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import http, { ACCESS_TOKEN_KEY } from "./api/http";
import { AuthPage } from "./components/auth/AuthPage";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import type { SupabaseAuthResponse, User } from "./types/auth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [rawToken, setRawToken] = useState<string | null>(() =>
    localStorage.getItem(ACCESS_TOKEN_KEY),
  );

  const canSubmit = Boolean(email.trim() && password.trim());

  useEffect(() => {
    async function hydrateSession() {
      const token =
        localStorage.getItem(ACCESS_TOKEN_KEY) ||
        sessionStorage.getItem(ACCESS_TOKEN_KEY);

      if (!token) {
        setHydrating(false);
        return;
      }

      try {
        const res = await http.get<User>("/auth/me");
        setUser(res.data);
      } catch {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        setRawToken(null);
        setUser(null);
      } finally {
        setHydrating(false);
      }
    }

    hydrateSession();
  }, []);

  async function saveTokenAndLoadUser(accessToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    setRawToken(accessToken);

    const backendResponse = await http.get<User>("/auth/me");
    setUser(backendResponse.data);
  }

  async function supabaseAuthRequest(path: "/auth/v1/token?grant_type=password" | "/auth/v1/signup") {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in frontend/.env");
    }

    const response = await fetch(`${supabaseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as SupabaseAuthResponse;
    return { response, data };
  }

  async function loginWithEmailPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    setLoading(true);
    try {
      const { response, data } = await supabaseAuthRequest("/auth/v1/token?grant_type=password");
      if (!response.ok || !data.access_token) {
        throw new Error(data.error_description || data.msg || "Supabase login failed");
      }

      await saveTokenAndLoadUser(data.access_token);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function signupWithEmailPassword() {
    setError(null);
    setNotice(null);

    setLoading(true);
    try {
      const { response, data } = await supabaseAuthRequest("/auth/v1/signup");
      if (!response.ok) {
        throw new Error(data.error_description || data.msg || "Supabase signup failed");
      }

      if (data.access_token) {
        await saveTokenAndLoadUser(data.access_token);
        return;
      }

      setNotice("Signup successful. Confirm email if your Supabase project requires confirmation.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    setRawToken(null);
    setUser(null);
    setError(null);
    setNotice(null);
  }

  if (hydrating) {
    return (
      <main className="page">
        <section className="card">
          <h1>Loading session...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Supabase Auth Test</h1>

        {!user ? (
          <AuthPage
            email={email}
            password={password}
            loading={loading}
            canSubmit={canSubmit}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onLoginSubmit={loginWithEmailPassword}
            onSignupClick={signupWithEmailPassword}
          />
        ) : (
          <DashboardPage
            user={user}
            rawToken={rawToken}
            onRefreshUser={async () => {
              setError(null);
              setNotice(null);
              try {
                const backendResponse = await http.get<User>("/auth/me");
                setUser(backendResponse.data);
              } catch (e) {
                const message = e instanceof Error ? e.message : "Backend verify failed";
                setError(message);
              }
            }}
            onLogout={logout}
          />
        )}

        {error && <p className="error">{error}</p>}
        {notice && <p className="notice">{notice}</p>}
      </section>
    </main>
  );
}

export default App;
