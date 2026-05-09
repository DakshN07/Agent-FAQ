import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, User as UserIcon, Phone, Linkedin } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [linkedinProfile, setLinkedinProfile] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setUser(data);
                    setPhoneNumber(data.phoneNumber || '');
                    setLinkedinProfile(data.linkedinProfile || '');
                }
            } catch (err) {
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/auth/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ phoneNumber, linkedinProfile })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update profile');
            toast.success("Profile saved successfully");
            setUser(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-slate-400">Loading profile...</div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Personal Profile</h2>
                    <p className="text-slate-400 mt-2">Update your personal contact details to be shared via AgentFAQ.</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="card-dark p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <UserIcon className="w-5 h-5 mr-3 text-emerald-500" />
                    Contact Information
                </h3>

                <div className="space-y-6 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-700 pr-3">
                                <Phone className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-12 pr-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">LinkedIn Profile</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-700 pr-3">
                                <Linkedin className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                type="url"
                                value={linkedinProfile}
                                onChange={e => setLinkedinProfile(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-12 pr-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
