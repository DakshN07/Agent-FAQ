"use client";

import Link from "next/link";
import { Sparkles, Building, ArrowRight, Lock, User, Mail, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import MistralKeyStep from "@/components/MistralKeyStep";

type Step = "account" | "mistral";

export default function RegisterOrgPage() {
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("account");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.register({
        username: adminName || orgName,
        email,
        password,
        role: "admin"
      });

      // Save user & org details
      localStorage.setItem('agent_faq_user', JSON.stringify({
        username: adminName,
        org: orgName,
        email: email,
        role: 'admin'
      }));
      localStorage.setItem('onboarding_orgName', orgName);

      // Account exists — send them to the AI-key step before the dashboard.
      // This is where the user is pointed at console.mistral.ai to get their
      // own key; it can be skipped and added later from Settings.
      setStep("mistral");
    } catch (err: any) {
      // Never fake a successful registration — surface the real error.
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/20 mb-4">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-center">
            {step === "account" ? "Create Organization" : "Connect your AI"}
          </h1>
          <p className="text-gray-400 mt-2 text-center text-sm">
            {step === "account"
              ? "Set up your organization to start managing events."
              : "One last step and your AI assistant is ready."}
          </p>
        </div>

        {/* Progress indicator */}
        {step === "mistral" && (
          <div className="flex items-center justify-center gap-2 mb-6 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Account created
            </span>
            <span className="w-8 h-px bg-white/15" />
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Add AI key
            </span>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ---- Step 1: account details ---- */}
          {step === "account" && (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Organization Name</label>
              <div className="relative">
                <input 
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 pl-10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Acme Corp" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required 
                />
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Admin Name</label>
              <div className="relative">
                <input 
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 pl-10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Jane Doe" 
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required 
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Email Address</label>
              <div className="relative">
                <input 
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 pl-10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="admin@acme.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Password</label>
              <div className="relative">
                <input 
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 pl-10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="••••••••" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="flex items-center justify-center w-full rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all mt-6 group disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          )}

          {/* ---- Step 2: bring-your-own Mistral API key ---- */}
          {step === "mistral" && (
            <MistralKeyStep onDone={() => router.push("/dashboard")} />
          )}
        </div>

        {step === "account" && (
        <p className="text-center text-sm text-gray-400 mt-8">
          Already have an organization?{" "}
          <Link href="/login" className="text-white font-medium hover:underline">
            Sign In
          </Link>
        </p>
        )}
      </div>
    </div>
  );
}
