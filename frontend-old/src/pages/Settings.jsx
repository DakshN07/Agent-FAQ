import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Sliders, Globe, AlignLeft, LayoutTemplate, Phone, Calendar, Link as LinkIcon, Instagram } from 'lucide-react';
import { useEvent } from '../contexts/EventContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Settings = () => {
    const { activeEvent, refreshEvents } = useEvent();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [faqThreshold, setFaqThreshold] = useState(0.85);
    const [instagramHandle, setInstagramHandle] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [appointmentLink, setAppointmentLink] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (activeEvent) {
            setName(activeEvent.name || '');
            setDescription(activeEvent.description || '');
            setFaqThreshold(activeEvent.faqThreshold || 0.85);
            setInstagramHandle(activeEvent.instagramHandle || '');
            setWebsiteUrl(activeEvent.websiteUrl || '');
            setContactNumber(activeEvent.contactNumber || '');
            setAppointmentLink(activeEvent.appointmentLink || '');
        }
    }, [activeEvent]);

    const handleSave = async () => {
        if (!activeEvent) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/events/${activeEvent._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ name, description, faqThreshold, instagramHandle, websiteUrl, contactNumber, appointmentLink })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update settings');

            toast.success("Settings saved successfully");
            await refreshEvents(); // Refresh context to reflect new name across app
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!activeEvent) return <div className="text-slate-400">Loading settings...</div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Workspace Settings</h2>
                    <p className="text-slate-400 mt-2">Configure behavior and preferences for <span className="text-white font-medium">{activeEvent.name}</span>.</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* General Info */}
            <div className="card-dark p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <LayoutTemplate className="w-5 h-5 mr-3 text-indigo-500" />
                    General Information
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Workspace / Event Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Brief description of the event..."
                        />
                    </div>
                </div>
            </div>

            {/* Event Profile Links */}
            <div className="card-dark p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Globe className="w-5 h-5 mr-3 text-emerald-500" />
                    Public Profile & Links
                </h3>
                <p className="text-sm text-slate-400 mb-6">These details will be passed to the AI so it can accurately direct users to your resources.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Website URL</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-700 pr-3">
                                <LinkIcon className="h-4 w-4 text-slate-500" />
                            </div>
                            <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-12 pr-3 text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://example.com" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Instagram Handle</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-700 pr-3">
                                <Instagram className="h-4 w-4 text-slate-500" />
                            </div>
                            <input type="text" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-12 pr-3 text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="@yourhandle" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Contact Phone Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-700 pr-3">
                                <Phone className="h-4 w-4 text-slate-500" />
                            </div>
                            <input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-12 pr-3 text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="+1 (555) 000-0000" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Booking / Appointment Link</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-700 pr-3">
                                <Calendar className="h-4 w-4 text-slate-500" />
                            </div>
                            <input type="url" value={appointmentLink} onChange={e => setAppointmentLink(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-12 pr-3 text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://calendly.com/your-event" />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Settings */}
            <div className="card-dark p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Sliders className="w-5 h-5 mr-3 text-primary-500" />
                    AI Configuration
                </h3>

                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-300">Confidence Threshold</label>
                            <span className="text-primary-400 font-mono text-sm">{faqThreshold.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0.5" max="0.95" step="0.01"
                            value={faqThreshold}
                            onChange={e => setFaqThreshold(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                        <p className="text-xs text-slate-500 mt-2">Determines how strict the AI is before auto-replying. A threshold of 0.85 requires an 85% match confidence. Lower values are more generous but may risk wrong answers.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
