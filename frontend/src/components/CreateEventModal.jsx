import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Sparkles } from 'lucide-react';
import { useEvent } from '../contexts/EventContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CreateEventModal = ({ isOpen, onClose }) => {
    const { refreshEvents, selectEvent } = useEvent();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiPrompts, setAiPrompts] = useState([]);
    const [step, setStep] = useState(1);
    const [loadingPhrase, setLoadingPhrase] = useState('');

    const PHRASES = [
        "Waking up the AI...",
        "Analyzing your event details...",
        "Grinding those FAQs...",
        "Reading between the lines...",
        "Structuring knowledge base...",
        "Almost there..."
    ];

    useEffect(() => {
        let interval;
        if (loading) {
            let i = 0;
            setLoadingPhrase(PHRASES[0]);
            interval = setInterval(() => {
                i = (i + 1) % PHRASES.length;
                setLoadingPhrase(PHRASES[i]);
            }, 2500); // Change phrase every 2.5 seconds
        }
        return () => clearInterval(interval);
    }, [loading]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Event name is required");

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const res = await fetch(`${API_URL}/api/events`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, description })
            });

            if (!res.ok) throw new Error("Failed to create event");
            const responseData = await res.json();

            await refreshEvents();
            selectEvent(responseData.event._id);
            toast.success("Event created! AI generated starting FAQs.");

            if (responseData.aiPrompts && responseData.aiPrompts.length > 0) {
                setAiPrompts(responseData.aiPrompts);
                setStep(2); // Move to review step
            } else {
                handleClose();
            }
        } catch (err) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setName('');
        setDescription('');
        setAiPrompts([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-200 cursor-default">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">
                        {step === 1 ? 'Create New Event' : 'AI Setup: Generated FAQs'}
                    </h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Event Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="e.g. HackMIT 2026"
                                autoFocus
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
                        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium shadow-lg transition-all disabled:opacity-50 min-w-[200px]"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center animate-pulse">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {loadingPhrase}
                                    </div>
                                ) : "Create Event & Setup"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm mb-4">
                            Our AI has generated some starting FAQs based on your event description. They have been saved to your dashboard.
                        </p>
                        <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                            {aiPrompts.map((p, idx) => (
                                <div key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                    <p className="font-semibold text-white text-sm">Q: {p.question}</p>
                                    <p className="text-slate-400 text-xs mt-1">A: {p.answer}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 flex justify-end pt-4 border-t border-slate-800">
                            <button onClick={handleClose} className="btn-primary w-full">Go to Dashboard</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateEventModal;
