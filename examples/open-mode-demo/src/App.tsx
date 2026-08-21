import { useAuth } from "@ssso/react";
import { CONFIG, tenantBaseUrl } from "./main.tsx";

export default function App() {
  const { user, loading, error, login, logout } = useAuth();

  const isPlaceholderConfig = CONFIG.clientId === "demo_client_id_123" || CONFIG.workspaceSlug === "demo";

  return (
    <div className="container">
      <div className="card">
        <header className="header">
          <span className="logo-badge">S</span>
          <h2>SSSO Open Mode Demo</h2>
        </header>

        {isPlaceholderConfig && !user && (
          <div className="info-box-alert">
            💡 <strong>Configuration Setup Required:</strong>
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", lineHeight: "1.4" }}>
              To avoid CORS blocking errors, replace the placeholder <code>clientId</code> and <code>workspaceSlug</code> in <code>src/main.tsx</code> with real values from your SSSO dashboard, and ensure <code>{CONFIG.redirectUri}</code> is added to redirect URLs.
            </p>
          </div>
        )}

        {error && <div className="error-alert">⚠️ {error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        ) : user ? (
          <div className="welcome-state">
            <div className="success-badge">✓ Signed In Successfully (via SDK)</div>
            <div className="profile-details">
              <div className="field">
                <span className="label">User ID</span>
                <span className="value font-mono">{user.id}</span>
              </div>
              <div className="field">
                <span className="label">Email Address</span>
                <span className="value font-semibold">{user.email}</span>
              </div>
            </div>
            <button onClick={logout} className="btn btn-secondary">
              Sign Out
            </button>
          </div>
        ) : (
          <div className="login-state">
            <p className="desc">
              This application is configured for <strong>Open Mode</strong>. Clicking below redirects you directly to the workspace auth subdomain for sign-in or registration.
            </p>

            <div className="url-preview">
              <span>Target Workspace URL:</span>
              <code>{tenantBaseUrl}</code>
            </div>

            <button onClick={() => login()} className="btn btn-primary">
              Sign In with SSSO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
