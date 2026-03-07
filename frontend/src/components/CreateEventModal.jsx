import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Sparkles } from 'lucide-react';
import { useEvent } from '../contexts/EventContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CreateEventModal = ({ isOpen, onClose }) => {
    const { refreshEvents, selectEvent } = useEvent();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingPhrase, setLoadingPhrase] = useState('');
    const [aiPrompts, setAiPrompts] = useState([]);

    // Form data
    const [name, setName] = useState('');
    const [details, setDetails] = useState({
        date: '',
        time: '',
        location: '',
        duration: '',
        prizes: '',
        theme: ''
    });
    const PHRASES = [
        "Waking up the AI...",
        "Converting your details into magic...",
        "Crafting a stellar event intro...",
        "Polishing the paragraphs...",
        "Preparing your FAQ database...",
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

    const handleNextStep = (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Event name is required");
        setStep(2);
    };

    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                body: JSON.stringify({
                    name,
                    useAIIntro: true,
                    details
                })
            });

            if (!res.ok) throw new Error("Failed to create event");
            const responseData = await res.json();

            await refreshEvents();
            selectEvent(responseData.event._id);
            toast.success("Event created! Magic successfully applied.");

            if (responseData.aiPrompts && responseData.aiPrompts.length > 0) {
                setAiPrompts(responseData.aiPrompts);
                setStep(3); // Move to review step
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
        setDetails({ date: '', time: '', location: '', duration: '', prizes: '', theme: '' });
        setAiPrompts([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-200 cursor-default">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">
                        {step === 1 && 'Step 1: Event Name'}
                        {step === 2 && 'Step 2: The Details'}
                        {step === 3 && 'AI Setup: Generated Content'}
                    </h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {step === 1 && (
                    <form onSubmit={handleNextStep} className="space-y-4">
                        <p className="text-slate-400 text-sm mb-4">Let's start with the basics. What's the name of your event?</p>
                        <div>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="e.g. Google I/O 2026"
                                autoFocus
                            />
                        </div>
                        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-800">
                            <button type="button" onClick={handleClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                            <button type="submit" disabled={!name.trim()} className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium shadow-lg transition-all disabled:opacity-50 min-w-[120px]">
                                Next Goal
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-slate-400 text-sm mb-4">Fill out whatever you know. Our AI will automatically write an engaging description and create your starting FAQs based on this info!</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Date(s)*</label>
                                <input name="date" value={details.date} onChange={handleDetailChange} required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-600" placeholder="e.g. Dec 10-12" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Duration / Days</label>
                                <input name="duration" value={details.duration} onChange={handleDetailChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-600" placeholder="e.g. 3 Days" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Time</label>
                                <input name="time" value={details.time} onChange={handleDetailChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-600" placeholder="e.g. 9 AM - 5 PM" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                                <input name="location" value={details.location} onChange={handleDetailChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-600" placeholder="e.g. San Francisco, CA" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Goodies & Prizes</label>
                            <input name="prizes" value={details.prizes} onChange={handleDetailChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-600" placeholder="e.g. T-Shirts, Macbook Pro for winners" />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Theme / Vibe</label>
                            <input name="theme" value={details.theme} onChange={handleDetailChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-600" placeholder="e.g. Cyberpunk, Fast-paced, Educational" />
                        </div>

                        <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-800">
                            <button type="button" onClick={() => setStep(1)} className="text-sm px-4 py-2 text-slate-400 hover:text-white transition-colors">Back</button>
                            <div className="flex space-x-3">
                                <button type="submit" disabled={loading} className="px-6 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 min-w-[240px]">
                                    {loading ? (
                                        <div className="flex items-center justify-center animate-pulse">
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            {loadingPhrase}
                                        </div>
                                    ) : (
                                        <span className="flex items-center justify-center"><Sparkles className="w-4 h-4 mr-2" />Let's make the intro of events!</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {step === 3 && (
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
