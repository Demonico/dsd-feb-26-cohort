import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthPage } from "./components/auth/AuthPage";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { useAuth } from "./hooks/useAuth";
import "./App.css";
import DriverManifest from "./pages/DriverManifest";
import CustomerPage from "./pages/CustomerPage";
import type { ReactNode } from "react";
import type { User } from "./types/auth";

type RoleGuardProps = {
  user: User | null;
  allowed: "driver" | "customer";
  children: ReactNode;
};

function RoleGuard({ user, allowed, children }: RoleGuardProps) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowed) return <div>Forbidden</div>;
  return <>{children}</>;
}

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
                  <AuthPage
                    loading={loading}
                    onLogin={login}
                    onSignup={signup}
                  />
                )
              }
            />

            <Route
              path="/dashboard"
              element={
                user ? (
                  <DashboardPage
                    user={user}
                    onRefreshUser={refreshUser}
                    onLogout={logout}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/driver"
              element={
                <RoleGuard user={user} allowed="driver">
                  <DriverManifest />
                </RoleGuard>
              }
            />

            <Route
              path="/customer"
              element={
                <RoleGuard user={user} allowed="customer">
                  <CustomerPage />
                </RoleGuard>
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
