import { Cloud, Shield } from "lucide-react";
import type { CloudAccount, AppSettings } from "@/types";

interface Props {
  accounts: CloudAccount[];
  appSettings: AppSettings | null;
}

export default function Settings({ accounts, appSettings }: Props) {
  const isConnected = (provider: string) =>
    accounts.some((a) => a.provider === provider);
  const getEmail = (provider: string) =>
    accounts.find((a) => a.provider === provider)?.email;

  const handleConnect = (provider: string) => {
    window.location.href = `http://localhost:3001/api/auth/${provider}`;
  };

  return (
    <div
      className="settings-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "800px",
      }}
    >
      <section className="card">
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Cloud size={20} className="text-accent" />
          Cloud Integrations
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
          }}
        >
          Connect your cloud storage accounts to automatically sync and
          visualize your documents.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Google Drive */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#fdf2f2",
                  display: "flex",
                  alignItems: "center",
                  justifySelf: "center",
                  justifyContent: "center",
                  color: "#dc2626",
                }}
              >
                G
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Google Drive</div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {isConnected("google")
                    ? `Connected as ${getEmail("google")}`
                    : "Not connected"}
                </div>
              </div>
            </div>
            <button
              className={
                isConnected("google") ? "btn-secondary" : "btn-primary"
              }
              onClick={() => handleConnect("google")}
              disabled={isConnected("google")}
              style={{
                backgroundColor: isConnected("google")
                  ? "var(--sidebar-bg)"
                  : "var(--text-primary)",
                color: isConnected("google")
                  ? "var(--text-secondary)"
                  : "white",
              }}
            >
              {isConnected("google") ? "Connected" : "Connect"}
            </button>
          </div>

          {/* OneDrive */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                }}
              >
                O
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>OneDrive</div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {isConnected("onedrive")
                    ? `Connected as ${getEmail("onedrive")}`
                    : "Not connected"}
                </div>
              </div>
            </div>
            <button
              className={
                isConnected("onedrive") ? "btn-secondary" : "btn-primary"
              }
              onClick={() => handleConnect("onedrive")}
              disabled={isConnected("onedrive")}
              style={{
                backgroundColor: isConnected("onedrive")
                  ? "var(--sidebar-bg)"
                  : "var(--text-primary)",
                color: isConnected("onedrive")
                  ? "var(--text-secondary)"
                  : "white",
              }}
            >
              {isConnected("onedrive") ? "Connected" : "Connect"}
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Shield size={20} className="text-accent" />
          General Preferences
        </h3>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                App Name: {appSettings?.app?.name || "DocTracker"}
              </div>
              <div
                style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}
              >
                The display name of your application.
              </div>
            </div>
            <div
              style={{
                width: "40px",
                height: "20px",
                backgroundColor: "var(--border)",
                borderRadius: "10px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  position: "absolute",
                  top: "2px",
                  left: "2px",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                Dark Mode
              </div>
              <div
                style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}
              >
                Switch between light and dark themes.
              </div>
            </div>
            <div
              style={{
                width: "40px",
                height: "20px",
                backgroundColor: "var(--border)",
                borderRadius: "10px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  position: "absolute",
                  top: "2px",
                  left: "2px",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                Auto Scan
              </div>
              <div
                style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}
              >
                Automatically scan for local changes every hour.
              </div>
            </div>
            <div
              style={{
                width: "40px",
                height: "20px",
                backgroundColor: "var(--accent)",
                borderRadius: "10px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .btn-secondary {
          background-color: var(--sidebar-bg);
          color: var(--text-secondary);
          cursor: default;
        }
      `}</style>
    </div>
  );
}
