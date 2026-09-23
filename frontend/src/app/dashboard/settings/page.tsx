"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Shield, Key, Save, Loader2, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, getStoredUser } from "@/lib/api";

type Tab = "General" | "Notifications" | "Security" | "API Keys";

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("General");

  // Notification email (persisted via the real settings API)
  const [notificationEmail, setNotificationEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password change (Security tab)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    // Prefer the user object the login/register flow stored; refresh from /me when possible.
    setUser(getStoredUser());
    api.getSettings()
      .then((s) => {
        if (s?.notificationEmail) setNotificationEmail(s.notificationEmail);
      })
      .catch(() => {});
  }, []);

  const handleSaveNotificationEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaved(false);
    setEmailError(null);
    setSavingEmail(true);
    try {
      await api.updateSettings({ notificationEmail });
      setEmailSaved(true);
    } catch (err: any) {
      setEmailError(err?.message || "Failed to save notification email");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    setSavingPw(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPwSuccess(true);
    } catch (err: any) {
      setPwError(err?.message || "Failed to update password");
    } finally {
      setSavingPw(false);
    }
  };

  const tabs = [
    { id: "General", icon: Settings },
    { id: "Notifications", icon: Bell },
    { id: "Security", icon: Shield },
    { id: "API Keys", icon: Key },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your personal preferences and organization configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all",
                  isActive 
                    ? "bg-white/10 text-white border border-white/5 shadow-sm" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <tab.icon className={cn("w-4 h-4", isActive ? "text-purple-400" : "text-gray-500")} />
                {tab.id}
              </button>
            );
          })}
        </div>

        {/* Settings Content Area */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === "General" && (
            <>
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-2">Profile Information</h2>
                <p className="text-sm text-gray-400 mb-6">Your account details, managed through your account.</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Full Name</label>
                      <input 
                        type="text" 
                        readOnly
                        value={user?.name || ""}
                        className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Email Address</label>
                      <input 
                        type="email" 
                        readOnly
                        value={user?.email || ""}
                        className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Email and name are managed by your authentication account.</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-red-500/50">
                <h2 className="text-xl font-semibold text-white mb-2">Danger Zone</h2>
                <p className="text-sm text-gray-400 mb-6">Irreversible and destructive actions for your account.</p>
                <button 
                  disabled
                  title="Not available yet"
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                >
                  Delete Organization (not available yet)
                </button>
              </div>
            </>
          )}

          {activeTab === "Notifications" && (
            <form onSubmit={handleSaveNotificationEmail} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Notification Email</label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => { setNotificationEmail(e.target.value); setEmailSaved(false); }}
                    placeholder="alerts@yourorg.com"
                    className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <p className="text-xs text-gray-500">Used for team-invite and moderation notifications.</p>
                </div>

                {emailError && (
                  <div className="flex items-center gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{emailError}</span>
                  </div>
                )}
                {emailSaved && (
                  <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Notification email saved.</span>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 mt-6 flex justify-end">
                  <button 
                    type="submit"
                    disabled={savingEmail}
                    className="bg-white text-black px-4 py-2 rounded-lg font-medium shadow-lg shadow-white/10 hover:bg-gray-100 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Preferences
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "Security" && (
            <form onSubmit={handleChangePassword} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPwSuccess(false); }}
                    placeholder="Your current password"
                    className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPwSuccess(false); }}
                    placeholder="At least 8 characters"
                    className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <p className="text-xs text-gray-500">
                    Updates your password and signs you out of all other devices.
                  </p>
                </div>

                {pwError && (
                  <div className="flex items-center gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Password updated. Sign in again with the new password.</span>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPw || !currentPassword || newPassword.length < 8}
                    className="bg-white text-black px-4 py-2 rounded-lg font-medium shadow-lg shadow-white/10 hover:bg-gray-100 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    Update Password
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "API Keys" && (
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">API Keys</h2>
              <p className="text-sm text-gray-400 mb-6">
                API access for the bot is authenticated with your account session. Secret management is
                handled server-side — no secret keys are exposed in this dashboard.
              </p>
              <div className="p-4 rounded-lg bg-black/20 border border-white/5 text-sm text-gray-400">
                Use the Swagger documentation (available in non-production environments) or the documented
                REST endpoints with your session token to interact with the API programmatically.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}