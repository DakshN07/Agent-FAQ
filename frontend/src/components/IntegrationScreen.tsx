"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface IntegrationState {
  id: string;
  name: string;
  iconColor: string;
  available: boolean;
}

interface IntegrationScreenProps {
  selectedChannels: string[];
  orgName: string;
  onComplete: (connectedChannels: string[]) => void;
}

export default function IntegrationScreen({ selectedChannels, orgName, onComplete }: IntegrationScreenProps) {
  const router = useRouter();
  const [integrations] = useState<IntegrationState[]>([
    { id: "Discord", name: "Discord Bot", iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", available: true },
    { id: "Telegram", name: "Telegram Bot", iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20", available: true },
    { id: "Slack", name: "Slack App", iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", available: true }
  ]);

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
            Authorized for <strong className="text-white">{orgName || "your workspace"}</strong>. You can connect official
            bots for each platform after setup from the dashboard&apos;s Integrations page.
          </p>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {integrations.map((item) => {
            const isSelected = selectedChannels.includes(item.id);
            return (
              <div 
                key={item.id}
                className={`rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[160px] bg-white/5 ${
                  isSelected ? "border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "border-white/5"
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
                </div>

                {/* Connection Action Area */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="w-full space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Supported — connect from the dashboard</span>
                    </div>
                    <button
                      onClick={() => router.push("/register/org")}
                      className="text-[11px] w-full px-4 py-2 font-semibold rounded-lg shadow-sm border transition-all cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 text-white flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Set up in dashboard
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete button */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={() => onComplete(selectedChannels)}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all cursor-pointer group"
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </button>
          
          <span className="text-[11px] text-gray-500 font-mono">
            Channels are activated from the Integrations page after you log in
          </span>
        </div>

      </div>
    </div>
  );
}