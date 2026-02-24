import { useEffect, useState } from "react";

import {
  clearStoredAccessToken,
  fetchCurrentUser,
  getStoredAccessToken,
  loginWithEmailPassword,
  registerCurrentUserRole,
  signupWithEmailPassword,
  storeAccessToken,
} from "../api/auth";
import type { Role, User } from "../types/auth";

type UseAuthResult = {
  user: User | null;
  hydrating: boolean;
  loading: boolean;
  error: string | null;
  notice: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: Role) => Promise<void>;
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
        await loadCurrentUser();
      } catch {
        clearStoredAccessToken();
        setUser(null);
      } finally {
        setHydrating(false);
      }
    }

    hydrateSession();
  }, []);

  async function loadCurrentUser() {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    return currentUser;
  }

  function clearMessages() {
    setError(null);
    setNotice(null);
  }

  async function runWithLoading(task: () => Promise<void>, fallbackError: string) {
    clearMessages();
    setLoading(true);

    try {
      await task();
    } catch (e) {
      const message = e instanceof Error ? e.message : fallbackError;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    clearMessages();

    try {
      await loadCurrentUser();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Backend verify failed";
      setError(message);
    }
  }

  async function login(email: string, password: string) {
    await runWithLoading(async () => {
      const accessToken = await loginWithEmailPassword(email, password);
      storeAccessToken(accessToken);
      const currentUser = await loadCurrentUser();
      const roleFromMetadata = currentUser.user_metadata?.role;
      if (!currentUser.role && roleFromMetadata) {
        await registerCurrentUserRole(roleFromMetadata);
        await loadCurrentUser();
      }
    }, "Login failed");
  }

  async function signup(email: string, password: string, role: Role) {
    await runWithLoading(async () => {
      const accessToken = await signupWithEmailPassword(email, password, role);
      if (accessToken) {
        storeAccessToken(accessToken);
        await registerCurrentUserRole(role);
        await loadCurrentUser();
        return;
      }

      setNotice("Signup successful. Confirm email if your Supabase project requires confirmation.");
    }, "Signup failed");
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
