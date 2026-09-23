"use client";

import Link from "next/link";
import { Sparkles, Mail, ArrowRight } from "lucide-react";

export default function RegisterMemberPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 mb-4">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-center">You were invited to a team</h1>
          <p className="text-gray-400 mt-2 text-center text-sm max-w-sm">
            Team members join an organization through a secure invite link sent to their email. If you received
            an invitation email, open the link it contains to create your account and join.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/invite"
            className="flex items-center justify-center gap-2 w-full rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all group"
          >
            Continue with my invite link
            <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center w-full rounded-md border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            I already have an account — Sign In
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Want to create an organization instead?{" "}
          <Link href="/register/org" className="text-white font-medium hover:underline">
            Register an organization
          </Link>
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-600">
          <Sparkles className="w-3.5 h-3.5" />
          Invite codes are issued by your organization&apos;s admin.
        </div>
      </div>
    </div>
  );
}