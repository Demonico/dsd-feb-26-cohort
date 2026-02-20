import { useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import { AuthPage } from "./components/auth/AuthPage";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { useAuth } from "./hooks/useAuth";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, hydrating, loading, error, notice, login, signup, refreshUser, logout } =
    useAuth();

  const canSubmit = Boolean(email.trim() && password.trim());

  async function loginWithEmailPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login(email, password);
  }

  async function signupWithEmailPassword() {
    await signup(email, password);
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
            onRefreshUser={refreshUser}
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
