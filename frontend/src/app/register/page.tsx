"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Building2, User, Lock, Mail } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />

      <div className="w-full max-w-xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background shadow-2xl mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-center">Create an Organization</h1>
          <p className="text-muted-foreground mt-2 text-center text-sm max-w-sm">
            Centralize your event FAQs, automate responses, and connect your community platforms.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          <form className="space-y-5">
            {/* Organization Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Organization Name
              </label>
              <div className="relative">
                <input 
                  className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm transition-all focus:border-emerald-500/50 focus:ring-emerald-500/20 pl-10"
                  placeholder="Acme Events Inc." 
                  type="text" 
                  required 
                />
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Admin Name
                </label>
                <div className="relative">
                  <input 
                    className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm transition-all focus:border-emerald-500/50 focus:ring-emerald-500/20 pl-10"
                    placeholder="Jane Doe" 
                    type="text" 
                    required 
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Admin Email
                </label>
                <div className="relative">
                  <input 
                    className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm transition-all focus:border-emerald-500/50 focus:ring-emerald-500/20 pl-10"
                    placeholder="jane@acme.com" 
                    type="email" 
                    required 
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Password
              </label>
              <div className="relative">
                <input 
                  className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm transition-all focus:border-emerald-500/50 focus:ring-emerald-500/20 pl-10"
                  placeholder="••••••••" 
                  type="password" 
                  required 
                  minLength={8}
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters long.</p>
            </div>

            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 h-10 px-4 py-2 w-full mt-6 group shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
              Register Organization
              <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an organization?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
