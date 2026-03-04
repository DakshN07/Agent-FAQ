import React, { useState, useEffect } from 'react';
import { Users, Shield, UserPlus, Trash2, Edit2, AlertCircle, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEvent } from '../contexts/EventContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TeamManager = () => {
    const { activeEvent } = useEvent();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // New Invite state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('agent');
    const [invitePlatforms, setInvitePlatforms] = useState({ discord: false, slack: false, whatsapp: false });

    // Assuming current logged in user token
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    useEffect(() => {
        if (activeEvent) fetchMembers();
    }, [activeEvent]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/events/${activeEvent._id}/team`, { headers });
            if (!res.ok) throw new Error('Failed to fetch team');
            const data = await res.json();
            setMembers(data);
        } catch (error) {
            console.error("Fetch team error:", error);
            // Fallback mock data if not properly hooked up yet
            setMembers([
                { _id: 'm1', userId: { username: 'Admin User', email: 'admin@faq.com' }, role: 'admin', platformAccess: ['discord', 'slack', 'whatsapp'] },
                { _id: 'm2', userId: { username: 'Agent Mark', email: 'mark@faq.com' }, role: 'agent', platformAccess: ['discord'] }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            const selectedPlatforms = Object.keys(invitePlatforms).filter(key => invitePlatforms[key]);
            const res = await fetch(`${API_URL}/api/events/${activeEvent._id}/team`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ email: inviteEmail, role: inviteRole, platformAccess: selectedPlatforms })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to invite user');
            }

            const newMember = await res.json();
            setMembers([...members, newMember]);
            setIsInviteModalOpen(false);
            setInviteEmail('');
            setInvitePlatforms({ discord: false, slack: false, whatsapp: false });
            toast.success("Team member added!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleRemove = async (memberId) => {
        if (!window.confirm("Are you sure you want to remove this team member?")) return;
        try {
            const res = await fetch(`${API_URL}/api/events/${activeEvent._id}/team/${memberId}`, {
                method: 'DELETE',
                headers
            });
            if (!res.ok) throw new Error("Failed to remove");
            setMembers(members.filter(m => m._id !== memberId));
            toast.success("Member removed");
        } catch (error) {
            toast.error(error.message);
        }
    };

    const togglePlatformForInvite = (platform) => {
        setInvitePlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
    };

    const getPlatformBadge = (platform) => {
        const colors = {
            discord: 'bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/30',
            slack: 'bg-[#E01E5A]/20 text-[#E01E5A] border-[#E01E5A]/30',
            whatsapp: 'bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30',
        };
        const defaultColor = 'bg-slate-700 text-slate-300 border-slate-600';
        return (
            <span key={platform} className={`px-2 py-1 rounded text-xs font-bold border ${colors[platform] || defaultColor} mr-2 capitalize`}>
                {platform}
            </span>
        );
    };

    if (loading) return <div className="text-white">Loading Team...</div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Team Management</h2>
                    <p className="text-slate-400 mt-2">Manage who can access and answer FAQs for this event.</p>
                </div>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="btn-primary flex items-center"
                >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Invite Member
                </button>
            </div>

            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-lg backdrop-blur-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 border-b border-slate-700/50">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-300">Member</th>
                            <th className="px-6 py-4 font-semibold text-slate-300">Role</th>
                            <th className="px-6 py-4 font-semibold text-slate-300">Platform Access</th>
                            <th className="px-6 py-4 font-semibold text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {members.map(member => (
                            <tr key={member._id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white mr-4 border border-slate-600">
                                            {member.userId?.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{member.userId?.username || 'Unknown'}</p>
                                            <p className="text-xs text-slate-500">{member.userId?.email || 'No Email'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${member.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-700 text-slate-300 border border-slate-600'
                                        }`}>
                                        {member.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                        {member.role}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {member.platformAccess?.length ? member.platformAccess.map(p => getPlatformBadge(p)) : <span className="text-slate-500 italic text-xs">Full Access</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleRemove(member._id)}
                                        className="text-slate-400 hover:text-rose-400 p-2 hover:bg-slate-700 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-200 cursor-default">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">User Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="agent@company.com"
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-2">The user must already be registered in the system.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="agent">Agent (Answers questions)</option>
                                    <option value="admin">Admin (Full Control)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3 mt-4">Platform Access Control</label>
                                <div className="space-y-3">
                                    {['discord', 'slack', 'whatsapp'].map(platform => (
                                        <label key={platform} className="flex items-center space-x-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border ${invitePlatforms[platform] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-800'} flex items-center justify-center transition-colors group-hover:border-emerald-400`}>
                                                {invitePlatforms[platform] && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-slate-300 capitalize">{platform}</span>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={invitePlatforms[platform]}
                                                onChange={() => togglePlatformForInvite(platform)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium shadow-lg transition-all"
                                >
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManager;
