import { useRef, useState, useEffect } from "react";
import { Cloud, Shield, Check, Edit2 } from "lucide-react";
import type { CloudAccount, AppSettings } from "@/types";
import axios from "axios";
import { toast } from "sonner"; // Assuming context provides this or import directly if available
import Page from "@/components/Page";

const API_BASE = "/api";

export default function SettingsMain() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const [accRes, setRes] = await Promise.all([
        axios.get(`${API_BASE}/accounts`),
        axios.get(`${API_BASE}/settings`),
      ]);
      setAccounts(accRes.data);
      setAppSettings(setRes.data);
    } catch (err) {
      console.error("Error fetching settings:", err);
      // Using alert/console fallback if toast not available in this context,
      // but App likely has Toaster.
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    if (!appSettings) return;
    try {
      setAppSettings(newSettings); // Optimistic
      await axios.post(`${API_BASE}/settings`, newSettings);
      toast.success("Settings saved");
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings");
      fetchSettingsData(); // Revert
    }
  };

  // Original UI Logic below
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isConnected = (provider: string) =>
    accounts.some((a) => a.provider === provider);
  const getEmail = (provider: string) =>
    accounts.find((a) => a.provider === provider)?.email;

  const handleConnect = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  const handleToggleTheme = () => {
    if (!appSettings) return;
    const newTheme = appSettings.app.theme === "dark" ? "light" : "dark";
    handleSaveSettings({
      ...appSettings,
      app: {
        ...appSettings.app,
        theme: newTheme,
      },
    });
  };

  const handleToggleAutoScan = () => {
    if (!appSettings) return;
    handleSaveSettings({
      ...appSettings,
      app: {
        ...appSettings.app,
        autoScan: !appSettings.app.autoScan,
      },
    });
  };

  const handleToggleAnimations = () => {
    if (!appSettings) return;
    handleSaveSettings({
      ...appSettings,
      app: {
        ...appSettings.app,
        animationsEnabled: !appSettings.app.animationsEnabled,
      },
    });
  };

  const startEditingName = () => {
    setTempName(appSettings?.app?.name || "DocTracker");
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const saveName = () => {
    if (!appSettings) return;
    setIsEditingName(false);
    if (tempName.trim() !== appSettings.app.name) {
      handleSaveSettings({
        ...appSettings,
        app: {
          ...appSettings.app,
          name: tempName.trim() || "DocTracker",
        },
      });
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveName();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  if (loading || !appSettings) {
    return (
      <Page title="Settings">
        <div className="p-8">Loading settings...</div>
      </Page>
    );
  }

  return (
    <Page title="Settings" subtitle="Manage your account preferences">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col gap-8 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Cloud size={20} className="text-blue-600" />
              Cloud Integrations
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Connect your cloud storage accounts to automatically sync and
              visualize your documents.
            </p>

            <div className="flex flex-col gap-4">
              {/* Google Drive */}
              <div className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold border border-red-100">
                    G
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Google Drive
                    </div>
                    <div className="text-xs text-gray-500">
                      {isConnected("google")
                        ? `Connected as ${getEmail("google")}`
                        : "Not connected"}
                    </div>
                  </div>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isConnected("google")
                      ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                      : "bg-gray-900 text-white hover:opacity-90"
                  }`}
                  onClick={() => handleConnect("google")}
                  disabled={isConnected("google")}
                >
                  {isConnected("google") ? (
                    <span className="flex items-center gap-1">
                      <Check size={14} /> Connected
                    </span>
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>

              {/* OneDrive */}
              <div className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                    O
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">OneDrive</div>
                    <div className="text-xs text-gray-500">
                      {isConnected("onedrive")
                        ? `Connected as ${getEmail("onedrive")}`
                        : "Not connected"}
                    </div>
                  </div>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isConnected("onedrive")
                      ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                      : "bg-gray-900 text-white hover:opacity-90"
                  }`}
                  onClick={() => handleConnect("onedrive")}
                  disabled={isConnected("onedrive")}
                >
                  {isConnected("onedrive") ? (
                    <span className="flex items-center gap-1">
                      <Check size={14} /> Connected
                    </span>
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              General Preferences
            </h3>

            <div className="space-y-6">
              <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    App Name
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    The display name of your application.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={handleNameKeyDown}
                        onBlur={saveName}
                        className="px-3 py-1.5 border border-blue-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <button
                        onClick={saveName}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">
                        {appSettings.app.name}
                      </span>
                      <button
                        onClick={startEditingName}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    Dark Mode
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Switch between light and dark themes.
                  </div>
                </div>
                <button
                  onClick={handleToggleTheme}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                    appSettings.app.theme === "dark"
                      ? "bg-blue-600"
                      : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${
                      appSettings.app.theme === "dark" ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    Auto Scan
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Automatically scan for local changes every hour.
                  </div>
                </div>
                <button
                  onClick={handleToggleAutoScan}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                    appSettings.app.autoScan ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${
                      appSettings.app.autoScan ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    Enable Animations
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Show animations when navigating and interacting.
                  </div>
                </div>
                <button
                  onClick={handleToggleAnimations}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                    appSettings.app.animationsEnabled
                      ? "bg-blue-600"
                      : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${
                      appSettings.app.animationsEnabled ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
}
