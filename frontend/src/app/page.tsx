"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Play, Server, Layers, HelpCircle, Check } from "lucide-react";
import WorkflowAnimation from "@/components/WorkflowAnimation";
import ConversationalOnboarding from "@/components/ConversationalOnboarding";
import IntegrationScreen from "@/components/IntegrationScreen";

type FlowState = "hero" | "onboarding" | "integrations";

interface OnboardingResult {
  buildingType: string;
  orgName: string;
  channels: string[];
  expectedMessages: string;
  aiGoals: string[];
}

export default function HomePage() {
  const [flow, setFlow] = useState<FlowState>("hero");
  const [onboardingData, setOnboardingData] = useState<OnboardingResult>({
    buildingType: "",
    orgName: "",
    channels: [],
    expectedMessages: "",
    aiGoals: [],
  });

  const router = useRouter();
  const easeCurve = [0.16, 1, 0.3, 1] as [number, number, number, number];

  const handleStartOnboarding = () => {
    setFlow("onboarding");
  };

  const handleOnboardingComplete = (data: OnboardingResult) => {
    setOnboardingData(data);
    
    // Save details to localStorage to customize dashboard representation
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_orgName", data.orgName);
      localStorage.setItem("onboarding_channels", JSON.stringify(data.channels));
    }
    
    setFlow("integrations");
  };

  const handleIntegrationsComplete = (connected: string[]) => {
    // Redirect to the actual 3-panel dashboard
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden select-none">
      
      {/* State Coordinator */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: HERO / LANDING PAGE */}
        {flow === "hero" && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ ease: easeCurve, duration: 0.8 }}
            className="relative w-full"
          >
            {/* Aurora Background Glows */}
            <div className="absolute inset-0 z-0">
              <div className="absolute top-[15%] left-[20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] mix-blend-screen" />
              <div className="absolute bottom-[20%] right-[15%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
            </div>

            {/* Navigation Header */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5 bg-black/10 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  Agent-FAQ
                </span>
              </div>

              <div className="flex gap-4 items-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Direct Login
                </button>
                <button
                  onClick={handleStartOnboarding}
                  className="px-4.5 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer shadow-md"
                >
                  Start Free
                </button>
              </div>
            </nav>

            {/* Hero Main Area */}
            <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-16 flex flex-col items-center text-center space-y-8">
              
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ease: easeCurve }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold tracking-wide"
              >
                <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                SUPPORT ENGINE AT SCALE
              </motion.div>

              {/* Title & Description */}
              <div className="space-y-4 max-w-3xl">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, ease: easeCurve }}
                  className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight"
                >
                  One AI Agent. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                    Every Support Channel.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, ease: easeCurve }}
                  className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
                >
                  Connect Discord, Slack, Telegram and WhatsApp. Let AI answer, learn and improve automatically.
                </motion.p>
              </div>

              {/* CTA triggers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, ease: easeCurve }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2"
              >
                <button
                  onClick={handleStartOnboarding}
                  className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all cursor-pointer group text-sm"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleStartOnboarding}
                  className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-white hover:bg-white/10 transition-all cursor-pointer text-sm"
                >
                  <Play className="w-4 h-4" />
                  Watch Demo
                </button>
              </motion.div>

              {/* Live workflow pipeline illustration (The User's Animation Demand) */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5, ease: easeCurve, duration: 1 }}
                className="w-full pt-12"
              >
                <WorkflowAnimation />
              </motion.div>

            </section>

            {/* Feature Highlights Section (Scroll encouragement) */}
            <section className="relative z-10 border-t border-white/5 bg-zinc-950/40 py-20">
              <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: Server, title: "Autonomous Routing", desc: "Instantly ingests messages from webhook routes and computes similarity indices." },
                  { icon: Layers, title: "Self-Learning Loop", desc: "Unanswered questions route directly to Human validation before training model weights." },
                  { icon: HelpCircle, title: "Minimal Noise", desc: "No complex dashboards or convoluted navigation logs. Simple support terminal." }
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-6 bg-[#0c0c0e]/30 border border-white/5 rounded-2xl flex flex-col gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>

          </motion.div>
        )}

        {/* VIEW 2: CONVERSATIONAL ONBOARDING */}
        {flow === "onboarding" && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ ease: easeCurve, duration: 0.6 }}
            className="w-full"
          >
            <ConversationalOnboarding 
              onComplete={handleOnboardingComplete}
              onBackToLanding={() => setFlow("hero")}
            />
          </motion.div>
        )}

        {/* VIEW 3: INTEGRATION MANAGER */}
        {flow === "integrations" && (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ ease: easeCurve, duration: 0.6 }}
            className="w-full"
          >
            <IntegrationScreen
              selectedChannels={onboardingData.channels}
              orgName={onboardingData.orgName}
              onComplete={handleIntegrationsComplete}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}
