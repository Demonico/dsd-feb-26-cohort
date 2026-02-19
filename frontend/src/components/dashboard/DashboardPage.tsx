import type { User } from "../../types/auth";

type DashboardPageProps = {
  user: User | null;
  rawToken: string | null;
  onRefreshUser: () => Promise<void>;
  onLogout: () => void;
};

export function DashboardPage({
  user,
  rawToken,
  onRefreshUser,
  onLogout,
}: DashboardPageProps) {
  return (
    <div className="result">
      <h2>Protected route: /dashboard</h2>
      <p>Backend user from `/auth/me`:</p>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h2>Token</h2>
      <p>{rawToken ? `${rawToken.slice(0, 25)}...` : "No token stored"}</p>

      <div className="actions">
        <button type="button" onClick={onRefreshUser}>
          Refresh /auth/me
        </button>
        <button type="button" className="secondary" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
