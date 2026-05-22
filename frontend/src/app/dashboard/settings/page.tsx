"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Shield, Key, Save, Trash2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "General" | "Notifications" | "Security" | "API Keys";

export default function SettingsPage() {
  const [user, setUser] = useState<{name: string, email: string, org?: string} | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  const handleCopyApi = () => {
    navigator.clipboard.writeText("sk_test_1234567890abcdefghijklmnopqrstuvwxyz");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Full Name</label>
                      <input 
                        type="text" 
                        defaultValue={user?.name || ""}
                        className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Email Address</label>
                      <input 
                        type="email" 
                        defaultValue={user?.email || ""}
                        className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Organization Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.org || "Agent-FAQ Default"}
                      className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-6 flex justify-end">
                    <button className="bg-white text-black px-4 py-2 rounded-lg font-medium shadow-lg shadow-white/10 hover:bg-gray-100 transition-all flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-red-500/50">
                <h2 className="text-xl font-semibold text-white mb-2">Danger Zone</h2>
                <p className="text-sm text-gray-400 mb-6">Irreversible and destructive actions for your account.</p>
                <button className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-medium hover:bg-red-500/20 transition-all">
                  Delete Organization
                </button>
              </div>
            </>
          )}

          {activeTab === "Notifications" && (
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-white/5 bg-black/20 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Email Alerts</h3>
                    <p className="text-sm text-gray-400">Receive alerts when new team members join</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-purple-500 cursor-pointer" />
                </div>
                <div className="flex items-center justify-between p-4 border border-white/5 bg-black/20 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Weekly Reports</h3>
                    <p className="text-sm text-gray-400">Get a weekly summary of system analytics</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-purple-500 cursor-pointer" />
                </div>
                <div className="pt-4 border-t border-white/10 mt-6 flex justify-end">
                  <button className="bg-white text-black px-4 py-2 rounded-lg font-medium shadow-lg shadow-white/10 hover:bg-gray-100 transition-all flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Security" && (
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
                <div className="pt-4 border-t border-white/10 mt-6 flex justify-end">
                  <button className="bg-white text-black px-4 py-2 rounded-lg font-medium shadow-lg shadow-white/10 hover:bg-gray-100 transition-all flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "API Keys" && (
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">API Keys</h2>
              <p className="text-sm text-gray-400 mb-6">Use this key to authenticate with the Agent-FAQ API.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Production Secret Key</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      readOnly 
                      value="sk_test_1234567890abcdefghijklmnopqrstuvwxyz"
                      className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed focus:outline-none"
                    />
                    <button 
                      onClick={handleCopyApi}
                      className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10 mt-6">
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all">
                    Generate New Key
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
