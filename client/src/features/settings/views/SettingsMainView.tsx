import { useRef, useState } from "react";
import { Cloud, Shield, Check, Edit2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CloudAccount, AppSettings } from "@/types";
import { toast } from "sonner";
import Page from "@/components/Page";
import { useSettingsStore } from "@/store/settingsStore";
import { settingsController } from "../controllers/SettingsController";

export default function SettingsMainView() {
  const queryClient = useQueryClient();
  const { updateSettings: updateStore } = useSettingsStore();

  // Queries
  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const data = await settingsController.fetchSettings();
      updateStore(data); // Keep Zustand in sync
      return data;
    },
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery<
    CloudAccount[]
  >({
    queryKey: ["accounts"],
    queryFn: () => settingsController.fetchAccounts(),
  });

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: AppSettings) =>
      settingsController.updateSettings(newSettings),
    onMutate: async (newSettings) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ["settings"] });
      const previous = queryClient.getQueryData(["settings"]);
      queryClient.setQueryData(["settings"], newSettings);
      updateStore(newSettings);
      return { previous };
    },
    onError: (_err, _newSettings, context) => {
      queryClient.setQueryData(["settings"], context?.previous);
      if (context?.previous) updateStore(context.previous as AppSettings);
      toast.error("Failed to save settings");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onSuccess: () => toast.success("Settings saved"),
  });

  const handleSaveSettings = (newSettings: AppSettings) => {
    updateSettingsMutation.mutate(newSettings);
  };

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
    handleSaveSettings({
      ...appSettings,
      app: {
        ...appSettings.app,
        theme: appSettings.app.theme === "dark" ? "light" : "dark",
      },
    });
  };

  const handleToggleAutoScan = () => {
    if (!appSettings) return;
    handleSaveSettings({
      ...appSettings,
      app: { ...appSettings.app, autoScan: !appSettings.app.autoScan },
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
        app: { ...appSettings.app, name: tempName.trim() || "DocTracker" },
      });
    }
  };

  if (loadingAccounts || !appSettings) {
    return (
      <Page title="Settings">
        <div className="p-8">Loading...</div>
      </Page>
    );
  }

  return (
    <Page title="Settings" subtitle="Manage your account preferences">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col gap-8 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Cloud size={20} className="text-blue-600" />
              Cloud Integrations
            </h3>
            <p className="text-sm text-gray-500 mb-6 dark:text-slate-400">
              Connect your cloud storage accounts to automatically sync and
              visualize your documents.
            </p>

            <div className="flex flex-col gap-4">
              {["google", "onedrive"].map((provider) => (
                <div
                  key={provider}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${provider === "google" ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/30" : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30"}`}
                    >
                      {provider === "google" ? "G" : "O"}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white capitalize">
                        {provider}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {isConnected(provider)
                          ? `Connected as ${getEmail(provider)}`
                          : "Not connected"}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isConnected(provider) ? "bg-green-50 text-green-700 border border-green-200 cursor-default" : "bg-gray-900 text-white hover:opacity-90 dark:bg-blue-600 dark:hover:bg-blue-500"}`}
                    onClick={() => handleConnect(provider)}
                    disabled={isConnected(provider)}
                  >
                    {isConnected(provider) ? (
                      <span className="flex items-center gap-1">
                        <Check size={14} /> Connected
                      </span>
                    ) : (
                      "Connect"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Shield size={20} className="text-blue-600" />
              General Preferences
            </h3>

            <div className="space-y-6">
              {/* App Name */}
              <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <div className="font-medium text-gray-900 text-sm dark:text-white">
                    App Name
                  </div>
                  <div className="text-xs text-gray-500 mt-1 dark:text-slate-400">
                    The display name of your application.
                  </div>
                </div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter"
                          ? saveName()
                          : e.key === "Escape" && setIsEditingName(false)
                      }
                      onBlur={saveName}
                      className="px-3 py-1.5 border border-blue-500 rounded-lg text-sm focus:outline-none dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      onClick={saveName}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">
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

              {/* Toggles */}
              {[
                {
                  label: "Dark Mode",
                  desc: "Switch between light and dark themes.",
                  value: appSettings.app.theme === "dark",
                  action: handleToggleTheme,
                },
                {
                  label: "Auto Scan",
                  desc: "Automatically scan for local changes.",
                  value: appSettings.app.autoScan,
                  action: handleToggleAutoScan,
                },
                {
                  label: "Enable Animations",
                  desc: "Show animations during interactions.",
                  value: appSettings.app.animationsEnabled,
                  action: handleToggleAnimations,
                },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900 text-sm dark:text-white">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 dark:text-slate-400">
                      {item.desc}
                    </div>
                  </div>
                  <button
                    onClick={item.action}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${item.value ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-700"}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${item.value ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
}
