import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,

} from "react-router-dom";
import { useState } from "react";

import { AuthPage } from "./components/auth/AuthPage";
import Sidebar from "./components/Sidebar";
import { sidebarItems } from "./components/sidebarItems";
import { useAuth } from "./hooks/useAuth";
import "./App.css";
import DriverManifest from "./pages/DriverManifest";
import CustomerPage from "./pages/CustomerPage";
import Dashboard from "./pages/Dashboard";
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

function AppRoutes() {
  const { user, hydrating, loading, login, signup, logout } =
    useAuth();
  const location = useLocation();
  const showSidebar = Boolean(user) && location.pathname !== "/login";
  const [expand, setExpand] = useState(true);

  return (
    <main className={showSidebar ? "flex-1 min-h-screen" : "app-shell"}>
      {showSidebar ? (
        <Sidebar items={sidebarItems} user={user} onLogout={logout} expand={expand} setExpand={setExpand} />
      ) : null}

      <section
        className="transition-all duration-300 p-6"
        style={{
          marginLeft: showSidebar ? (expand ? 256 : 80) : 0,
        }}
      >

        {/* Displays error and notice messages if they exist */}
        {/* {error ? <p className="error">{error}</p> : null}
        {notice ? <p className="notice">{notice}</p> : null} */}

        {hydrating ? (
          <p>Restoring session...</p>
        ) : (
          <Routes>
            <Route
              path="/login"
              element={
                user ? (
                  user.role == "driver" ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <Navigate to="/customer" />
                  )

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
                  user.role === "driver" ? (
                   <Dashboard/>
                  ) : (
                    <Navigate to="/customer" replace />
                  )
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
