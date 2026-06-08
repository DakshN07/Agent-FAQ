"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Mail, Shield, MoreVertical, Trash2, Edit, X, Loader2 } from "lucide-react";
import { apiFetch, ensureCurrentEventId } from "@/lib/api";

type TeamMember = {
  _id: string;
  email: string;
  userId?: { username?: string; email?: string } | null;
  role: string;
  status: "Pending" | "Active" | "Removed" | string;
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      const currentEventId = await ensureCurrentEventId();
      setEventId(currentEventId);
      if (!currentEventId) return;

      const members = await apiFetch<TeamMember[]>(`/events/${currentEventId}/team`);
      setTeamMembers(members);
    };

    fetchMembers().catch((error) => console.error("Failed to load team members", error));
  }, []);

  const removeMember = async (id: string) => {
    setTeamMembers(teamMembers.map(m => m._id === id ? { ...m, status: "Removed" } : m));
    setOpenMenuId(null);
    if (!eventId) return;
    try {
      await apiFetch(`/events/${eventId}/team/${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to remove team member", error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsInviting(true);
    
    try {
      if (!eventId) throw new Error("Create or select an event before inviting members.");
      const response = await apiFetch<{ member: TeamMember }>(`/events/${eventId}/team/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setTeamMembers([...teamMembers, response.member]);
      setIsInviteModalOpen(false);
      setInviteEmail("");
    } catch (error) {
      console.error("Failed to invite team member", error);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Team Management</h1>
          <p className="text-muted-foreground">Manage your organization's members and their roles.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden min-h-[300px] flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/5">
          <Users className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold text-lg text-white">Active Members</h2>
        </div>
        
        {teamMembers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No members found</h3>
            <p className="text-gray-400 max-w-sm">No team member has been assigned in your organisation yet. Invite someone to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-visible">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-black/20 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Member</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teamMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md ${member.status === 'Removed' ? 'bg-gray-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                          {member.userId?.username?.charAt(0) || member.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {member.userId?.username || 'Pending User'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        {member.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        member.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : member.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          member.status === 'Active' ? 'bg-emerald-400' : 
                          member.status === 'Pending' ? 'bg-amber-400' : 'bg-red-400'
                        }`}></span>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === member._id ? null : member._id)}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {openMenuId === member._id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-6 top-10 w-48 bg-[#131825] border border-white/10 rounded-lg shadow-xl z-20 py-1 flex flex-col text-left">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors w-full text-left">
                              <Edit className="w-4 h-4" />
                              Change Role
                            </button>
                            {member.status !== 'Removed' && (
                              <button 
                                onClick={() => removeMember(member._id)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove Access
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#131825] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all">
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                Invite New Member
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                >
                  <option value="agent">Viewer - Can only view data</option>
                  <option value="agent">Editor - Can modify FAQs and settings</option>
                  <option value="admin">Admin - Full access including team</option>
                </select>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-sm text-purple-200">
                An invitation email will be sent to this address with a secure link to join your organization.
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isInviting || !inviteEmail}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-lg font-medium shadow-lg hover:shadow-purple-500/40 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInviting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Mail className="w-4 h-4" /> Send Invite</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
