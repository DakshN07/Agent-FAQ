"use client";

import Link from "next/link";
import { Sparkles, Building, ArrowRight, Lock, User, Mail } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterOrgPage() {
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call to /api/auth/register/org
    // router.push("/dashboard/events/create");
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
          <h1 className="text-3xl font-bold tracking-tight text-center">Create Organization</h1>
          <p className="text-gray-400 mt-2 text-center text-sm">
            Set up your organization to start managing events.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 space-y-6">
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

            <button type="submit" className="flex items-center justify-center w-full rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all mt-6 group">
              Register Organization
              <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-white font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
