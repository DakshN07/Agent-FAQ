"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Sparkles, Building, MessageSquare, Target } from "lucide-react";

interface OnboardingData {
  buildingType: string;
  orgName: string;
  channels: string[];
  expectedMessages: string;
  aiGoals: string[];
}

interface ConversationalOnboardingProps {
  onComplete: (data: OnboardingData) => void;
  onBackToLanding: () => void;
}

export default function ConversationalOnboarding({ onComplete, onBackToLanding }: ConversationalOnboardingProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    buildingType: "",
    orgName: "",
    channels: ["Discord", "Telegram", "WhatsApp"], // Discord, Telegram, WhatsApp checked by default, Slack unchecked
    expectedMessages: "",
    aiGoals: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Easing curve from user instructions
  const easeCurve = [0.16, 1, 0.3, 1] as [number, number, number, number];

  // Auto-focus input on Step 2
  useEffect(() => {
    if (step === 2 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const nextStep = () => {
    if (step < 5) {
      setStep((prev) => prev + 1);
    } else {
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      onBackToLanding();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step === 1 && !data.buildingType) return;
      if (step === 2 && !data.orgName.trim()) return;
      if (step === 3 && data.channels.length === 0) return;
      if (step === 4 && !data.expectedMessages) return;
      if (step === 5 && data.aiGoals.length === 0) return;
      nextStep();
    }
  };

  // Step 1 Options
  const buildingOptions = ["SaaS", "Community", "Event", "E-Commerce", "Agency", "Startup", "Other"];

  // Step 3 Options
  const channelOptions = ["Discord", "Telegram", "Slack", "WhatsApp"];

  // Step 4 Options
  const messageOptions = ["<1000", "1000-5000", "5000-25000", "25000+"];

  // Step 5 Options
  const goalOptions = ["FAQs", "Support", "Moderation", "Analytics", "Lead Generation"];

  const toggleChannel = (channel: string) => {
    setData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const toggleGoal = (goal: string) => {
    setData((prev) => ({
      ...prev,
      aiGoals: prev.aiGoals.includes(goal)
        ? prev.aiGoals.filter((g) => g !== goal)
        : [...prev.aiGoals, goal],
    }));
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center bg-black text-white px-4 py-8 relative overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Aurora Background Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[140px]" />
      </div>

      {/* Onboarding Shell */}
      <div className="w-full max-w-xl z-10">
        
        {/* Top Header & Progress */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={prevStep}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">Step {step} of 5</span>
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ ease: easeCurve, duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Steps */}
        <div className="min-h-[350px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(10px)" }}
              transition={{ ease: easeCurve, duration: 0.6 }}
              className="space-y-6"
            >
              
              {/* STEP 1: What are you building? */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Context Setup</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">What are you building?</h2>
                    <p className="text-sm text-gray-400">Help us tailor your support AI to your specific audience.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {buildingOptions.map((opt) => {
                      const isSelected = data.buildingType === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setData((prev) => ({ ...prev, buildingType: opt }))}
                          className={`p-4 rounded-xl border text-sm font-semibold transition-all text-center flex items-center justify-center cursor-pointer ${
                            isSelected 
                              ? "bg-white/10 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                              : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  
                  {data.buildingType && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={nextStep}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* STEP 2: Organization Name */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Identity</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">What is your organization name?</h2>
                    <p className="text-sm text-gray-400">This will be used to label your AI instance and sync metadata.</p>
                  </div>

                  <div className="relative">
                    <Building className="absolute left-4 top-4 text-gray-500 w-5 h-5" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="e.g. Acme Support Corp"
                      value={data.orgName}
                      onChange={(e) => setData((prev) => ({ ...prev, orgName: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-xl text-lg font-semibold placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all text-white"
                    />
                  </div>

                  {data.orgName.trim() && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={nextStep}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* STEP 3: Where do users talk? */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Channels</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Where do your users talk?</h2>
                    <p className="text-sm text-gray-400">Select all channels you plan to connect for AI coverage.</p>
                  </div>

                  <div className="space-y-3">
                    {channelOptions.map((channel) => {
                      const isChecked = data.channels.includes(channel);
                      return (
                        <button
                          key={channel}
                          onClick={() => toggleChannel(channel)}
                          className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all text-left ${
                            isChecked
                              ? "bg-white/5 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                              : "bg-white/2 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 font-semibold">
                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all ${
                              isChecked ? "bg-purple-500 border-purple-500 text-white" : "border-gray-500"
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            {channel}
                          </div>
                          <span className="text-[10px] uppercase font-mono text-gray-500">
                            {isChecked ? "Sync Scheduled" : "Inactive"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={nextStep}
                    disabled={data.channels.length === 0}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black disabled:bg-white/50 disabled:cursor-not-allowed font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 4: Expected Monthly Messages */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Capacity</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Expected monthly messages?</h2>
                    <p className="text-sm text-gray-400">Helps us optimize the message throughput pipeline size.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {messageOptions.map((opt) => {
                      const isSelected = data.expectedMessages === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setData((prev) => ({ ...prev, expectedMessages: opt }))}
                          className={`p-4 rounded-xl border flex items-center justify-between text-sm font-semibold transition-all ${
                            isSelected
                              ? "bg-white/10 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                              : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          <span>{opt} messages</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-purple-500 bg-purple-500" : "border-gray-500"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {data.expectedMessages && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={nextStep}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* STEP 5: What should AI help with? */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Capability</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">What should AI help with?</h2>
                    <p className="text-sm text-gray-400">Select capabilities to configure AI weights and agent tools.</p>
                  </div>

                  <div className="space-y-3">
                    {goalOptions.map((goal) => {
                      const isChecked = data.aiGoals.includes(goal);
                      return (
                        <button
                          key={goal}
                          onClick={() => toggleGoal(goal)}
                          className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all text-left ${
                            isChecked
                              ? "bg-white/5 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                              : "bg-white/2 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 font-semibold">
                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all ${
                              isChecked ? "bg-purple-500 border-purple-500 text-white" : "border-gray-500"
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            {goal}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={nextStep}
                    disabled={data.aiGoals.length === 0}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                  >
                    Finish Setup & Connect Channels
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
