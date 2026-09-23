"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Shield, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{ email: string; organization: string } | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No invitation token found in the URL.");
      setIsLoading(false);
      return;
    }

    // Decode the JWT payload (unsigned verification happens server-side on accept).
    // This only surfaces the invite details for display; validity is enforced by
    // the /api/auth/accept-invite endpoint using the server's JWT secret.
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) {
        setError("This invitation link appears to be invalid.");
        setIsLoading(false);
        return;
      }
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload?.email || !payload?.organization) {
        setError("This invitation link appears to be invalid or has expired.");
        setIsLoading(false);
        return;
      }
      setInviteData({
        email: payload.email,
        organization: payload.organization
      });
    } catch (e) {
      setError("This invitation link appears to be invalid or has expired.");
    }

    setIsLoading(false);
  }, [token]);

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await api.acceptInvite({ token, name, password });
      // Redirect to dashboard where the event will show in the user's scope.
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "We could not accept this invitation. It may be expired or already used.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="bg-[#131825] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />

      <div className="bg-[#131825]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
          <p className="text-gray-400">
            You've been invited to join <span className="text-purple-400 font-semibold">{inviteData?.organization}</span>.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAcceptInvite} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={inviteData?.email}
                disabled
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-gray-300 cursor-not-allowed"
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Create Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long.</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name || !password}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3.5 rounded-xl font-medium shadow-lg hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Setting up your account...</>
            ) : (
              <>Accept Invitation <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          By accepting this invitation, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F19] flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>}>
      <InviteContent />
    </Suspense>
  );
}