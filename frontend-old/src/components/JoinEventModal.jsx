import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Users } from 'lucide-react';
import { useEvent } from '../contexts/EventContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const JoinEventModal = ({ isOpen, onClose }) => {
    const { refreshEvents, selectEvent } = useEvent();
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setJoining(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/events/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ inviteCode: joinCode })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to join team");

            toast.success("Successfully joined the team!");
            await refreshEvents();
            if (data.event) {
                selectEvent(data.event._id);
            }
            onClose();
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-200 cursor-default">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <Users className="w-5 h-5 mr-2 text-indigo-400" /> Join a Team
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="text-center mb-6">
                    <p className="text-slate-400 text-sm">Enter the 6-digit access code provided by the event organizer.</p>
                </div>

                <form onSubmit={handleJoinTeam} className="space-y-4">
                    <input
                        type="text"
                        placeholder="e.g. A1B2C3"
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-[0.3em] font-mono text-xl"
                        maxLength={6}
                        autoFocus
                    />
                    <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={joining || joinCode.length < 5}
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg transition-all disabled:opacity-50"
                        >
                            {joining ? "Joining..." : "Join Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinEventModal;
