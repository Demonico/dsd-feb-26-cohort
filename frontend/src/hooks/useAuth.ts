import { useEffect, useState } from "react";

import {
  clearStoredAccessToken,
  fetchCurrentUser,
  getStoredAccessToken,
  loginWithEmailPassword,
  signupWithEmailPassword,
  storeAccessToken,
} from "../api/auth";
import type { User } from "../types/auth";

type UseAuthResult = {
  user: User | null;
  hydrating: boolean;
  loading: boolean;
  error: string | null;
  notice: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function hydrateSession() {
      const token = getStoredAccessToken();
      if (!token) {
        setHydrating(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        clearStoredAccessToken();
        setUser(null);
      } finally {
        setHydrating(false);
      }
    }

    hydrateSession();
  }, []);

  async function refreshUser() {
    setError(null);
    setNotice(null);

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Backend verify failed";
      setError(message);
    }
  }

  async function login(email: string, password: string) {
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const accessToken = await loginWithEmailPassword(email, password);
      storeAccessToken(accessToken);

      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function signup(email: string, password: string) {
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const accessToken = await signupWithEmailPassword(email, password);
      if (accessToken) {
        storeAccessToken(accessToken);

        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
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
    clearStoredAccessToken();
    setUser(null);
    setError(null);
    setNotice(null);
  }

  return {
    user,
    hydrating,
    loading,
    error,
    notice,
    login,
    signup,
    refreshUser,
    logout,
  };
}
