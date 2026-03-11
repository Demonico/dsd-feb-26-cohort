import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";
import type { ReactNode } from "react";

import { AuthPage } from "./components/auth/AuthPage";
import ForgotPassPage from "./components/auth/ForgotPassPage";
import ResetPassPage from "./components/auth/ResetPassPage";
import Sidebar from "./components/Sidebar";
import { sidebarItems } from "./components/sidebarItems";
import { useAuth } from "./hooks/useAuth";
import "./App.css";
import DriverManifest from "./pages/DriverManifest";
import CustomerPage from "./pages/CustomerPage";
import Dashboard from "./pages/Dashboard";
import SignupPage from "./pages/SignupPage";
import CustomerProofView from "./pages/CustomerProofView";
import type { User } from "./types/auth";

type RoleGuardProps = {
  user: User | null;
  allowed: "driver" | "customer";
  children: ReactNode;
};

function roleHomePath(role: User["role"]) {
  return role === "driver" ? "/dashboard" : "/customer";
}

function RoleGuard({ user, allowed, children }: RoleGuardProps) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowed) return <div>Forbidden</div>;
  return <>{children}</>;
}

function AppRoutes() {
  const {
    user,
    hydrating,
    loading,
    error,
    notice,
    checkEmailExists,
    login,
    signupWithProfile,
    logout,
  } = useAuth();
  const location = useLocation();
  const showSidebar =
    Boolean(user) &&
    location.pathname !== "/login" &&
    location.pathname !== "/signup" &&
    location.pathname !== "/forgot-password" &&
    location.pathname !== "/reset-password";
  const [expand, setExpand] = useState(true);

  const loginElement = user ? (
    <Navigate to={roleHomePath(user.role)} />
  ) : (
    <AuthPage
      loading={loading}
      error={error}
      notice={notice}
      onCheckEmail={checkEmailExists}
      onLogin={login}
    />
  );

  const signupElement = user ? (
    <Navigate to={roleHomePath(user.role)} replace />
  ) : (
    <SignupPage
      loading={loading}
      error={error}
      notice={notice}
      onSignup={signupWithProfile}
    />
  );

  let dashboardElement: ReactNode = <Navigate to="/login" replace />;
  if (user) {
    dashboardElement =
      user.role === "driver" ? <Dashboard /> : <Navigate to="/customer" replace />;
  }

  return (
    <main className={showSidebar ? "flex-1 min-h-screen" : "app-shell"}>
      {showSidebar ? (
        <Sidebar
          items={sidebarItems}
          user={user}
          onLogout={logout}
          expand={expand}
          setExpand={setExpand}
        />
      ) : null}

      <section
        className="transition-all duration-300 p-6"
        style={{
          marginLeft: showSidebar ? (expand ? 256 : 80) : 0,
        }}
      >
        {hydrating ? (
          <p>Restoring session...</p>
        ) : (
          <Routes>
            <Route path="/login" element={loginElement} />
            <Route path="/signup" element={signupElement} />
            <Route
              path="/forgot-password"
              element={
                user ? <Navigate to={roleHomePath(user.role)} replace /> : <ForgotPassPage />
              }
            />
            <Route
              path="/reset-password"
              element={
                user ? <Navigate to={roleHomePath(user.role)} replace /> : <ResetPassPage />
              }
            />
            <Route path="/dashboard" element={dashboardElement} />

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
              path="/proof"
              element={
                <RoleGuard user={user} allowed="customer">
                  <CustomerProofView />
                </RoleGuard>
              }
            />

            <Route
              path="*"
              element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
            />
          </Routes>
        )}
      </section>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
