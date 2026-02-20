import "./App.css";
import { AuthPage } from "./components/auth/AuthPage";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, hydrating, loading, error, notice, login, signup, refreshUser, logout } =
    useAuth();

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
            loading={loading}
            onLogin={login}
            onSignup={signup}
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
