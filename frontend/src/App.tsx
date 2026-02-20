import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthPage } from "./components/auth/AuthPage";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

function App() {
  const {
    user,
    hydrating,
    loading,
    error,
    notice,
    login,
    signup,
    refreshUser,
    logout,
  } = useAuth();

  return (
    <BrowserRouter>
      <main className="app-shell">
        <h1>Fleet Dashboard</h1>

        {error ? <p className="error">{error}</p> : null}
        {notice ? <p className="notice">{notice}</p> : null}

        {hydrating ? (
          <p>Restoring session...</p>
        ) : (
          <Routes>
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <AuthPage loading={loading} onLogin={login} onSignup={signup} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                user ? (
                  <DashboardPage user={user} onRefreshUser={refreshUser} onLogout={logout} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="*"
              element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
            />
          </Routes>
        )}
      </main>
    </BrowserRouter>
  );
}

export default App;
