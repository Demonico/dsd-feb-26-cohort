import type { FormEvent } from "react";

type AuthPageProps = {
  email: string;
  password: string;
  loading: boolean;
  canSubmit: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLoginSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onSignupClick: () => Promise<void>;
};

export function AuthPage({
  email,
  password,
  loading,
  canSubmit,
  onEmailChange,
  onPasswordChange,
  onLoginSubmit,
  onSignupClick,
}: AuthPageProps) {
  return (
    <>
      <p className="subtitle">Email/password sign in and sign up with Supabase.</p>

      <form onSubmit={onLoginSubmit} className="login-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
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
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </label>

        <div className="actions">
          <button type="submit" disabled={!canSubmit || loading}>
            {loading ? "Working..." : "Sign in"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!canSubmit || loading}
            onClick={onSignupClick}
          >
            Sign up
          </button>
        </div>
      </form>
    </>
  );
}
