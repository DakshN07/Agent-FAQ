"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface IntegrationState {
  id: string;
  name: string;
  iconColor: string;
  connected: boolean;
  connecting: boolean;
  syncTime: number;
  flowCount: number;
}

interface IntegrationScreenProps {
  selectedChannels: string[];
  orgName: string;
  onComplete: (connectedChannels: string[]) => void;
}

export default function IntegrationScreen({ selectedChannels, orgName, onComplete }: IntegrationScreenProps) {
  const [integrations, setIntegrations] = useState<IntegrationState[]>([
    { id: "Discord", name: "Discord Bot", iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", connected: false, connecting: false, syncTime: 0, flowCount: 0 },
    { id: "Telegram", name: "Telegram Bot", iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20", connected: false, connecting: false, syncTime: 0, flowCount: 0 },
    { id: "Slack", name: "Slack App", iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", connected: false, connecting: false, syncTime: 0, flowCount: 0 },
    { id: "WhatsApp", name: "WhatsApp Cloud API", iconColor: "text-green-400 bg-green-500/10 border-green-500/20", connected: false, connecting: false, syncTime: 0, flowCount: 0 }
  ]);

  // Handle auto-population of initial user selections from onboarding step
  useEffect(() => {
    // If user pre-selected them, we list them clearly
  }, [selectedChannels]);

  // Update sync counters and flow metrics in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setIntegrations((prev) =>
        prev.map((item) => {
          if (item.connected) {
            const nextSync = item.syncTime >= 10 ? 0 : item.syncTime + 1;
            const newFlows = item.flowCount + Math.floor(Math.random() * 3);
            return { ...item, syncTime: nextSync, flowCount: newFlows };
          }
          return item;
        })
      );
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleConnect = (id: string) => {
    // Trigger simulated connection loader
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, connecting: true } : item))
    );

    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, connected: true, connecting: false, syncTime: 0, flowCount: Math.floor(Math.random() * 20) }
            : item
        )
      );
    }, 1500);
  };

  const activeConnected = integrations.filter((i) => i.connected).map((i) => i.id);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white px-4 py-8 relative overflow-hidden">
      {/* Aurora Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-25%] right-[10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-25%] left-[10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-2xl z-10 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Workspace Ready
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Connect Support Channels</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Authorized for <strong className="text-white">{orgName || "your workspace"}</strong>. Setup active webhooks to start feeding your AI agent.
          </p>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {integrations.map((item) => {
            const isSelected = selectedChannels.includes(item.id);
            return (
              <div 
                key={item.id}
                className={`glass-card rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[160px] ${
                  item.connected 
                    ? "border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
                    : isSelected 
                      ? "border-purple-500/20" 
                      : "border-white/5"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold ${item.iconColor}`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{item.id}</h4>
                      <p className="text-[11px] text-gray-500">Official Channel Integration</p>
                    </div>
                  </div>

                  {item.connected && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                {/* Connection Action Area */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <AnimatePresence mode="wait">
                    {item.connected ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Connected
                          </span>
                          <span className="text-gray-500 font-mono text-[10px]">
                            Last: {item.syncTime}s ago
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 bg-white/5 rounded-lg p-2 font-mono">
                          <span>Status: Ingestion active</span>
                          <span className="text-purple-400 font-bold">{item.flowCount} messages</span>
                        </div>
                      </motion.div>
                    ) : item.connecting ? (
                      <motion.div 
                        key="connecting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-xs text-gray-400 font-medium"
                      >
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        Provisioning agent keys...
                      </motion.div>
                    ) : (
                      <motion.button
                        key="connect-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleConnect(item.id)}
                        className={`text-xs px-4 py-2 font-semibold rounded-lg shadow-sm border transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-purple-600 border-purple-500 hover:bg-purple-700 text-white" 
                            : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                        }`}
                      >
                        Connect Channel
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete button */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={() => onComplete(activeConnected)}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all cursor-pointer group"
          >
            Launch AI Support OS
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </button>
          
          <span className="text-[11px] text-gray-500 font-mono">
            {activeConnected.length > 0 
              ? `${activeConnected.length} pipeline(s) streaming data` 
              : "Proceed to workspace with offline simulation"}
          </span>
        </div>

      </div>
    </div>
  );
}
