import { useRef, useState } from "react";
import { Cloud, Shield, Check, Edit2 } from "lucide-react";
import type { CloudAccount, AppSettings } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  accounts: CloudAccount[];
  appSettings: AppSettings | null;
  onSaveSettings: (settings: AppSettings) => void;
}

export default function Settings({
  accounts,
  appSettings,
  onSaveSettings,
}: Props) {
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

  const updateSetting = (
    key: keyof AppSettings["app"],
    value: string | boolean,
  ) => {
    if (!appSettings) return;
    onSaveSettings({
      ...appSettings,
      app: {
        ...appSettings.app,
        [key]: value,
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
      updateSetting("name", tempName.trim() || "DocTracker");
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveName();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  if (!appSettings) return <div>Loading settings...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            <CardTitle>Cloud Integrations</CardTitle>
          </div>
          <CardDescription>
            Connect your cloud storage accounts to automatically sync and
            visualize your documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Google Drive */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 bg-red-50 text-red-600 border border-red-100">
                <AvatarFallback className="bg-red-50 text-red-600 font-bold">
                  G
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">Google Drive</div>
                <div className="text-xs text-muted-foreground">
                  {isConnected("google")
                    ? `Connected as ${getEmail("google")}`
                    : "Not connected"}
                </div>
              </div>
            </div>
            <Button
              variant={isConnected("google") ? "outline" : "default"}
              className={
                isConnected("google")
                  ? "text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700"
                  : ""
              }
              onClick={() => handleConnect("google")}
              disabled={isConnected("google")}
            >
              {isConnected("google") ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Connected
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>

          {/* OneDrive */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 bg-blue-50 text-blue-600 border border-blue-100">
                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                  O
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">OneDrive</div>
                <div className="text-xs text-muted-foreground">
                  {isConnected("onedrive")
                    ? `Connected as ${getEmail("onedrive")}`
                    : "Not connected"}
                </div>
              </div>
            </div>
            <Button
              variant={isConnected("onedrive") ? "outline" : "default"}
              className={
                isConnected("onedrive")
                  ? "text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700"
                  : ""
              }
              onClick={() => handleConnect("onedrive")}
              disabled={isConnected("onedrive")}
            >
              {isConnected("onedrive") ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Connected
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>General Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-base">App Name</Label>
              <p className="text-xs text-muted-foreground">
                The display name of your application.
              </p>
            </div>
            <div className="flex items-center gap-2 w-[220px] justify-end">
              {isEditingName ? (
                <div className="flex items-center gap-2 w-full">
                  <Input
                    ref={nameInputRef}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={saveName}
                    className="h-8"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600"
                    onClick={saveName}
                  >
                    <Check size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {appSettings.app.name}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={startEditingName}
                  >
                    <Edit2 size={14} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-base">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">
                Switch between light and dark themes.
              </p>
            </div>
            <Switch
              checked={appSettings.app.theme === "dark"}
              onCheckedChange={(checked) =>
                updateSetting("theme", checked ? "dark" : "light")
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-base">Auto Scan</Label>
              <p className="text-xs text-muted-foreground">
                Automatically scan for local changes every hour.
              </p>
            </div>
            <Switch
              checked={appSettings.app.autoScan}
              onCheckedChange={(checked) => updateSetting("autoScan", checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-base">Enable Animations</Label>
              <p className="text-xs text-muted-foreground">
                Show animations when navigating and interacting.
              </p>
            </div>
            <Switch
              checked={appSettings.app.animationsEnabled}
              onCheckedChange={(checked) =>
                updateSetting("animationsEnabled", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
