import type { User } from "../../types/auth";

type DashboardPageProps = {
  user: User | null;
  onRefreshUser: () => Promise<void>;
  onLogout: () => void;
};

export function DashboardPage({
  user,
  onRefreshUser,
  onLogout,
}: DashboardPageProps) {
  return (
    <div className="result">
      <h2>Logged in as</h2>
      <p>{user?.email ?? ""}</p>

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
