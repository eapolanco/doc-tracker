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
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
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
          <div className="flex justify-between items-center p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold">
                G
              </div>
              <div>
                <div className="font-semibold text-gray-900">Google Drive</div>
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
                  ? "bg-gray-100 text-gray-900 cursor-default"
                  : "bg-gray-900 text-white hover:opacity-90"
              }`}
              onClick={() => handleConnect("google")}
              disabled={isConnected("google")}
            >
              {isConnected("google") ? "Connected" : "Connect"}
            </button>
          </div>

          {/* OneDrive */}
          <div className="flex justify-between items-center p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
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
                  ? "bg-gray-100 text-gray-900 cursor-default"
                  : "bg-gray-900 text-white hover:opacity-90"
              }`}
              onClick={() => handleConnect("onedrive")}
              disabled={isConnected("onedrive")}
            >
              {isConnected("onedrive") ? "Connected" : "Connect"}
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
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900 text-sm">
                App Name: {appSettings?.app?.name || "DocTracker"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                The display name of your application.
              </div>
            </div>
            <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer opacity-50">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900 text-sm">
                Dark Mode
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Switch between light and dark themes.
              </div>
            </div>
            <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
            </div>
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
            <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
