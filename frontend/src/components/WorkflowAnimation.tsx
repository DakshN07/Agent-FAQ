"use client";

import { motion } from "framer-motion";
import { MessageSquare, Bot, CheckCircle2, AlertCircle, Users, Database, Sparkles, Send } from "lucide-react";
import { useState, useEffect } from "react";

export default function WorkflowAnimation() {
  const [activeWorkflow, setActiveWorkflow] = useState<"auto" | "review">("auto");

  // Cycle active workflow highlights
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWorkflow((prev) => (prev === "auto" ? "review" : "auto"));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto py-16 px-4 relative">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 blur-3xl pointer-events-none rounded-3xl" />

      {/* Grid Header */}
      <div className="text-center mb-12">
        <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
          Live System Pipeline
        </span>
        <h3 className="text-2xl font-bold text-white mt-4">Autonomous Knowledge Ingestion</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* PIPELINE 1: AI Auto-Answer Flow */}
        <div className={`glass-card rounded-2xl p-6 transition-all duration-700 relative overflow-hidden border ${
          activeWorkflow === "auto" ? "border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.08)]" : "border-white/5 opacity-60"
        }`}>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
            <span className="text-[10px] text-purple-300 font-mono">AUTONOMOUS</span>
          </div>

          <h4 className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-6 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Instant AI Auto-Response
          </h4>

          {/* Workflow Graphic */}
          <div className="flex flex-col items-center gap-6 relative py-4">
            
            {/* Input Channels */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm z-10">
              {["Discord", "Telegram", "Slack"].map((channel, i) => (
                <motion.div
                  key={channel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-black/60 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1 shadow-lg text-center"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    channel === "Discord" ? "bg-indigo-500/10 text-indigo-400" :
                    channel === "Telegram" ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">{channel}</span>
                </motion.div>
              ))}
            </div>

            {/* Glowing Connector Paths (Down to AI Agent) */}
            <div className="w-1 h-10 relative bg-gradient-to-b from-purple-500/30 to-purple-500/80">
              <motion.div 
                className="absolute top-0 left-0 w-full h-3 bg-purple-400 rounded-full blur-[2px]"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* AI Agent Node */}
            <motion.div 
              className="bg-purple-950/20 border border-purple-500/30 w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-lg shadow-purple-500/5 z-10"
              animate={activeWorkflow === "auto" ? {
                boxShadow: ["0 0 10px rgba(168,85,247,0.1)", "0 0 30px rgba(168,85,247,0.3)", "0 0 10px rgba(168,85,247,0.1)"]
              } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Bot className="w-8 h-8 text-purple-400" />
              <div className="absolute inset-0 rounded-2xl border border-purple-400/40 animate-ping opacity-40 pointer-events-none" />
            </motion.div>

            {/* Path down to Answered */}
            <div className="w-1 h-10 relative bg-gradient-to-b from-purple-500/80 to-emerald-500/80">
              <motion.div 
                className="absolute top-0 left-0 w-full h-3 bg-emerald-400 rounded-full blur-[2px]"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Answered Output Node */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/5 z-10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300 tracking-wide font-mono">ANSWERED ✓</span>
            </div>

          </div>
        </div>

        {/* PIPELINE 2: Human-in-the-Loop Feedback Flow */}
        <div className={`glass-card rounded-2xl p-6 transition-all duration-700 relative overflow-hidden border ${
          activeWorkflow === "review" ? "border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.08)]" : "border-white/5 opacity-60"
        }`}>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[10px] text-amber-300 font-mono">HUMAN-IN-THE-LOOP</span>
          </div>

          <h4 className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Collaborative Learning Loop
          </h4>

          {/* Workflow Graphic */}
          <div className="flex flex-col items-center gap-4 relative py-2">
            
            {/* Unknown Question */}
            <div className="bg-black/60 border border-white/5 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg max-w-xs w-full justify-center z-10">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-300 font-medium">Unknown Question Received</span>
            </div>

            {/* Path down to Human Review */}
            <div className="w-1 h-6 relative bg-gradient-to-b from-amber-500/30 to-amber-500/80">
              <motion.div 
                className="absolute top-0 left-0 w-full h-3 bg-amber-400 rounded-full blur-[2px]"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Human Review */}
            <div className="bg-black/60 border border-amber-500/30 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg max-w-xs w-full justify-center z-10">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-200 font-semibold">Human Review Console</span>
            </div>

            {/* Path down to Knowledge Base Updated */}
            <div className="w-1 h-6 relative bg-gradient-to-b from-amber-500/80 to-blue-500/80">
              <motion.div 
                className="absolute top-0 left-0 w-full h-3 bg-blue-400 rounded-full blur-[2px]"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Knowledge Base Updated */}
            <div className="bg-blue-950/20 border border-blue-500/30 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg max-w-xs w-full justify-center z-10">
              <Database className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-xs text-blue-300 font-semibold font-mono">Knowledge Base Updated</span>
            </div>

            {/* Feedback Loop Back to Auto Answer */}
            <div className="w-1 h-6 relative bg-gradient-to-b from-blue-500/80 to-purple-500/80">
              <motion.div 
                className="absolute top-0 left-0 w-full h-3 bg-purple-400 rounded-full blur-[2px]"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Auto Answer Future */}
            <div className="bg-purple-950/20 border border-purple-500/30 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg max-w-xs w-full justify-center z-10">
              <CheckCircle2 className="w-4 h-4 text-purple-400 animate-bounce" />
              <span className="text-xs text-purple-300 font-semibold font-mono">Auto Answer Future Questions</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
