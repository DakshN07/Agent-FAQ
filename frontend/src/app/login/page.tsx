"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/20 mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-center">Welcome back</h1>
          <p className="text-gray-400 mt-2 text-center text-sm">
            Sign in to your Agent-FAQ account
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 space-y-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">
                Email
              </label>
              <input 
                className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="you@company.com" 
                type="email" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-200">
                  Password
                </label>
                <Link href="#" className="text-xs text-purple-400 hover:text-purple-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input 
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 pl-10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="••••••••" 
                  type="password" 
                  required 
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <button className="flex items-center justify-center w-full rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all mt-6 group">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Don't have an account?{" "}
          <Link href="/register/org" className="text-white font-medium hover:underline">
            Register your organization
          </Link>
        </p>
      </div>
    </div>
  );
}
