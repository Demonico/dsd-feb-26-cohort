import { useState } from "react";
import type { FormEvent } from "react";
import type { Role } from "../../types/auth";

type AuthPageProps = {
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, role: Role) => Promise<void>;
};

export function AuthPage({
  loading,
  onLogin,
  onSignup,
}: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const canSubmit = Boolean(email.trim() && password.trim());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(email, password);
  }

  async function handleSignupClick() {
    await onSignup(email, password, role);
  }

  return (
    <>
      <p className="subtitle">Email/password sign in and sign up with Supabase.</p>

      <form onSubmit={handleSubmit} className="login-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={loading}
          >
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
          </select>
        </label>

        <div className="actions">
          <button type="submit" disabled={!canSubmit || loading}>
            {loading ? "Working..." : "Sign in"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!canSubmit || loading}
            onClick={handleSignupClick}
          >
            Sign up
          </button>
        </div>
      </form>
    </>
  );
}
