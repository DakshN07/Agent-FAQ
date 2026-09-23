"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, MessageSquare, Bot, Database, BarChart3, Shield, Settings, 
  Sparkles, ShieldCheck, ChevronRight, Activity, Bell, Wifi, Radio, AlertTriangle, LogOut
} from "lucide-react";
import DashboardViews from "@/components/DashboardViews";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import { api, getStoredActiveEventId, setStoredActiveEventId, getStoredUser } from "@/lib/api";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [orgName, setOrgName] = useState("Your Organization");
  const [activeEventId, setActiveEventId] = useState<string>("");
  const [userInitial, setUserInitial] = useState("U");
  const [connectedChannels, setConnectedChannels] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.logout();
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  // Load user & events from API or localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = getStoredUser();
      if (user) {
        if (user.org) setOrgName(user.org);
        if (user.username) setUserInitial(user.username.charAt(0).toUpperCase());
      }

      const storedOrg = localStorage.getItem("onboarding_orgName");
      if (storedOrg) setOrgName(storedOrg);

      // Try fetching events
      api.getEvents().then((events) => {
        if (Array.isArray(events) && events.length > 0) {
          setActiveEventId(events[0]._id);
          setStoredActiveEventId(events[0]._id);
          if (events[0].name) setOrgName(events[0].name);
        }
      }).catch(() => {});
    }
  }, []);

  // Load real connected channels from the integrations API once we know an event.
  useEffect(() => {
    if (!activeEventId) return;
    api.getIntegrations(activeEventId)
      .then((integrations) => {
        if (!Array.isArray(integrations)) return;
        const active = integrations
          .filter((i) => i && i.isActive)
          .map((i) => {
            const name = (i.platform || '').toLowerCase();
            if (name.includes('discord')) return 'Discord';
            if (name.includes('slack')) return 'Slack';
            if (name.includes('telegram')) return 'Telegram';
            return i.platform;
          })
          .filter(Boolean);
        if (active.length > 0) setConnectedChannels(active as string[]);
      })
      .catch(() => {});
  }, [activeEventId]);

  const navItems = [
    { name: "Overview", icon: Home },
    { name: "Inbox", icon: MessageSquare },
    { name: "AI Agent", icon: Bot },
    { name: "Knowledge", icon: Database },
    { name: "Analytics", icon: BarChart3 },
    { name: "Moderation", icon: Shield },
    { name: "Settings", icon: Settings },
  ];

  const easeCurve = [0.16, 1, 0.3, 1] as [number, number, number, number];

  return (
    <div className="h-screen w-screen bg-[#060606] text-white flex flex-col overflow-hidden relative selection:bg-purple-500/20">
      
      {/* Aurora subtle radial background glows */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[130px] mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* 1. FLOATING TOP BAR */}
      <header className="relative z-20 flex-shrink-0 mx-4 mt-4 glass rounded-2xl border border-white/5 py-3 px-6 flex items-center justify-between shadow-lg shadow-black/50">
        
        {/* Left segment (Logo / Workspace breadcrumbs) */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-gray-400 tracking-wide">AI-Support OS</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <span className="font-semibold text-white tracking-wide">{orgName}</span>
          </div>
        </div>

        {/* Center segment (System status) */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-full text-[10px] text-emerald-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SYSTEM: OPERATIONAL</span>
          <span className="text-gray-600">•</span>
          <span>{activeEventId ? "Event connected" : "No event selected"}</span>
        </div>

        {/* Right segment (Ingestion streams and user state) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Channels: {connectedChannels.length > 0 ? connectedChannels.join(", ") : "None connected"}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-red-300 border border-white/5 hover:bg-red-500/20 hover:border-red-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-white border border-white/5">
            {userInitial}
          </div>
        </div>
      </header>

      {/* BOTTOM LAYOUT GRID (3 Panels) */}
      <div className="flex-1 flex overflow-hidden relative z-10 px-4 pb-4 gap-4 mt-4">
        
        {/* PANEL 1: COLLAPSIBLE LEFT NAVIGATION SIDEBAR (Hover Expands) */}
        <motion.nav
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          animate={{ width: isSidebarHovered ? 200 : 64 }}
          transition={{ ease: easeCurve, duration: 0.4 }}
          className="glass border border-white/5 rounded-2xl flex flex-col justify-between py-4 overflow-hidden shadow-lg select-none"
        >
          {/* Main items list */}
          <div className="space-y-1.5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full py-3 px-3.5 rounded-xl text-left flex items-center gap-3.5 transition-all relative cursor-pointer ${
                    isActive 
                      ? "bg-white/5 border-l-2 border-purple-500 text-white font-semibold" 
                      : "text-gray-400 hover:text-white hover:bg-white/2"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  
                  {isSidebarHovered && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs tracking-wide font-medium"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer segment */}
          <div className="px-2 font-mono text-[9px] text-gray-600 text-center">
            {isSidebarHovered ? "AGENT-OS V1.0.0" : "V1"}
          </div>
        </motion.nav>

        {/* PANEL 2: CENTER WORKSPACE (Dynamic content) */}
        <div className="flex-1 glass border border-white/5 rounded-2xl overflow-hidden shadow-lg bg-[#0c0c0e]/40 relative">
          <AppErrorBoundary>
            <DashboardViews activeTab={activeTab} connectedChannels={connectedChannels} eventId={activeEventId} />
          </AppErrorBoundary>
        </div>

        {/* PANEL 3: RIGHT CONTEXT PANEL (System context) */}
        <aside className="w-80 glass border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg overflow-y-auto select-none">
          
          {/* Top section: Event context */}
          <div className="space-y-6">
            
            {/* API Connectivity Status */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">API Connectivity</span>
              <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Backend Status</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Live connection to the API server</p>
                </div>
                <div className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                  activeEventId ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${activeEventId ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {activeEventId ? "ONLINE" : "NO EVENT"}
                </div>
              </div>
            </div>

            {/* Connected Channels */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Connected Channels</span>
              <div className="space-y-2">
                {["Discord", "Telegram", "Slack"].map((channel) => {
                  const isActive = connectedChannels.includes(channel);
                  return (
                    <div key={channel} className="flex items-center justify-between text-xs px-2.5 py-2 rounded-lg bg-white/2 border border-white/2">
                      <span className="text-gray-300 font-medium">{channel}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-600"}`} />
                        <span className="text-[9px] font-mono text-gray-500">
                          {connectedChannels.length === 0 ? "LOADING" : (isActive ? "ACTIVE" : "OFF")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Alerts (only when real alerts exist) */}
            {alerts.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Recent Alerts</span>
                <div className="space-y-2">
                  {alerts.map((alert, i) => (
                    <div key={i} className="p-3 bg-red-950/5 border border-red-500/10 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] text-gray-300 font-medium leading-relaxed font-mono">
                        {alert}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {connectedChannels.length === 0 && alerts.length === 0 && (
              <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                No active integrations or alerts. Connect a channel from the Integrations page to get started.
              </p>
            )}
          </div>

          {/* Bottom section: Session summary */}
          <div className="pt-4 border-t border-white/5 space-y-2 text-[10px] text-gray-500 font-mono">
            <div className="flex justify-between">
              <span>Active Event</span>
              <span className="text-white">{activeEventId ? orgName : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>User</span>
              <span className="text-white">{userInitial}</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
