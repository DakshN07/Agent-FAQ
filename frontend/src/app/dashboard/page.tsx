"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, MessageSquare, Bot, Database, BarChart3, Shield, Settings, 
  Sparkles, ShieldCheck, ChevronRight, Activity, Bell, Wifi, Radio, AlertTriangle
} from "lucide-react";
import DashboardViews from "@/components/DashboardViews";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [orgName, setOrgName] = useState("Acme Events Corp");
  const [connectedChannels, setConnectedChannels] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([
    "Prompt Injection blocked in Slack #support",
    "FAQ Suggestions ready for review (37 hits)",
    "New spammer flagged on Telegram: @user123"
  ]);

  // Load configuration from conversational onboarding if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedOrg = localStorage.getItem("onboarding_orgName");
      if (storedOrg) setOrgName(storedOrg);
      
      const storedChannels = localStorage.getItem("onboarding_channels");
      if (storedChannels) {
        try {
          setConnectedChannels(JSON.parse(storedChannels));
        } catch (e) {
          setConnectedChannels(["Discord", "Telegram", "WhatsApp"]);
        }
      } else {
        setConnectedChannels(["Discord", "Telegram", "WhatsApp"]);
      }
    }
  }, []);

  const navItems = [
    { name: "Overview", icon: Home },
    { name: "Inbox", icon: MessageSquare, badge: 41 },
    { name: "AI Agent", icon: Bot },
    { name: "Knowledge", icon: Database },
    { name: "Analytics", icon: BarChart3 },
    { name: "Moderation", icon: Shield, badge: 27 },
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

        {/* Center segment (Observability Telemetry Badge) */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-full text-[10px] text-emerald-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SYSTEM HEALTH: OPTIMAL</span>
          <span className="text-gray-600">•</span>
          <span>p99 Latency: 24ms</span>
        </div>

        {/* Right segment (Pipelines and user state) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Ingestion streams: {connectedChannels.join(", ") || "offline demo"}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-white border border-white/5">
            A
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

                  {item.badge && !isSidebarHovered && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500" />
                  )}

                  {item.badge && isSidebarHovered && (
                    <span className="ml-auto text-[9px] font-bold font-mono px-2 py-0.5 bg-purple-500/20 border border-purple-500/20 text-purple-300 rounded-full">
                      {item.badge}
                    </span>
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
          <DashboardViews activeTab={activeTab} connectedChannels={connectedChannels} />
        </div>

        {/* PANEL 3: RIGHT CONTEXT PANEL (Telemetry Assistant) */}
        <aside className="w-80 glass border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg overflow-y-auto select-none">
          
          {/* Top section: AI confidence + Quick stats */}
          <div className="space-y-6">
            
            {/* AI Confidence Circular Dial/Progress */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Inference Quality</span>
              <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">AI Confidence</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Weighted vector index accuracy</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-purple-500/10 border border-purple-500/20 w-12 h-12 rounded-full relative shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <span className="text-xs font-mono font-bold text-purple-400">94.5%</span>
                  <div className="absolute inset-0.5 rounded-full border border-purple-500 border-dashed animate-spin duration-1000 opacity-60" />
                </div>
              </div>
            </div>

            {/* Active Channels Pulsers */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Live Channels status</span>
              <div className="space-y-2">
                {["Discord", "Telegram", "WhatsApp", "Slack"].map((channel) => {
                  const isActive = connectedChannels.includes(channel) || channel === "Discord" || channel === "Telegram";
                  return (
                    <div key={channel} className="flex items-center justify-between text-xs px-2.5 py-2 rounded-lg bg-white/2 border border-white/2">
                      <span className="text-gray-300 font-medium">{channel}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-600"}`} />
                        <span className="text-[9px] font-mono text-gray-500">
                          {isActive ? "ACTIVE" : "STANDBY"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real-time Alerts */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Recent Threat Alerts</span>
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

          </div>

          {/* Bottom section: Quick Summary / System telemetry */}
          <div className="pt-4 border-t border-white/5 space-y-2 text-[10px] text-gray-500 font-mono">
            <div className="flex justify-between">
              <span>Active Members</span>
              <span className="text-white">1,420</span>
            </div>
            <div className="flex justify-between">
              <span>Sync Interval</span>
              <span className="text-white">Real-time webhooks</span>
            </div>
            <div className="flex justify-between">
              <span>Secure Sandboxing</span>
              <span className="text-emerald-400">ENABLED</span>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
