import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Sparkles, Box, ArrowRight } from 'lucide-react';

const Landing = () => {
    const [showSplash, setShowSplash] = useState(true);
    const [animatingLogos, setAnimatingLogos] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Sequence the splash animation
        const timer1 = setTimeout(() => setAnimatingLogos(true), 1000); // Start logo squeeze
        const timer2 = setTimeout(() => setShowSplash(false), 3500); // End splash

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    if (showSplash) {
        return (
            <div className="fixed inset-0 bg-[#0f172a] z-50 flex items-center justify-center overflow-hidden">
                <div className="relative w-full max-w-lg h-96 flex items-center justify-center">

                    {/* Main AgentFAQ Box */}
                    <div className={`absolute z-20 flex flex-col items-center justify-center w-48 h-48 border-2 border-primary-500/30 rounded-3xl bg-slate-900/80 backdrop-blur-xl shadow-[0_0_50px_rgba(56,189,248,0.2)] transition-all duration-1000 ${animatingLogos ? 'scale-110 shadow-[0_0_100px_rgba(56,189,248,0.4)]' : 'scale-90 opacity-0 animate-fade-in'}`}>
                        <Box className="w-12 h-12 text-primary-400 mb-2" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">AgentFAQ</span>
                    </div>

                    {/* Platform Logos Squeezing In */}
                    <div className={`absolute transition-all duration-1000 ${animatingLogos ? 'translate-x-0 translate-y-0 opacity-0 scale-50' : '-translate-x-32 -translate-y-32 opacity-100 scale-100'}`}>
                        <div className="w-16 h-16 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/20">
                            <span className="text-white font-bold text-xl">D</span>
                        </div>
                    </div>

                    <div className={`absolute transition-all duration-1000 ${animatingLogos ? 'translate-x-0 translate-y-0 opacity-0 scale-50' : 'translate-x-32 -translate-y-32 opacity-100 scale-100'}`}>
                        <div className="w-16 h-16 rounded-2xl bg-[#E01E5A] flex items-center justify-center shadow-lg shadow-[#E01E5A]/20">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                    </div>

                    <div className={`absolute transition-all duration-1000 delay-100 ${animatingLogos ? 'translate-x-0 translate-y-0 opacity-0 scale-50' : '-translate-x-32 translate-y-32 opacity-100 scale-100'}`}>
                        <div className="w-16 h-16 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                            <span className="text-white font-bold text-xl">W</span>
                        </div>
                    </div>

                    <div className={`absolute transition-all duration-1000 delay-100 ${animatingLogos ? 'translate-x-0 translate-y-0 opacity-0 scale-50' : 'translate-x-32 translate-y-32 opacity-100 scale-100'}`}>
                        <div className="w-16 h-16 rounded-2xl bg-[#229ED9] flex items-center justify-center shadow-lg shadow-[#229ED9]/20">
                            <span className="text-white font-bold text-xl">T</span>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // NETFLIX STYLE LANDING PAGE
    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8">

            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[#0f172a]/80 animate-fade-in z-10 backdrop-blur-[2px]"></div>
                {/* Simulated running chats effect */}
                <div className="absolute w-full h-full opacity-10 overflow-hidden pointer-events-none flex flex-col select-none">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className={`flex items-center space-x-4 mb-4 whitespace-nowrap animate-slide-left`} style={{ animationDuration: `${20 + Math.random() * 20}s`, animationDelay: `${-Math.random() * 10}s` }}>
                            <span className="text-sm font-mono text-primary-500">USER_{Math.floor(Math.random() * 1000)}:</span>
                            <span className="text-sm text-slate-300">Where is the event being held?</span>
                            <span className="text-sm font-mono text-emerald-500 ml-8">BOT:</span>
                            <span className="text-sm text-slate-300">The main stage is at Hall {Math.floor(Math.random() * 10)}!</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-20 max-w-4xl text-center px-4">

                <div className="inline-flex items-center px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-400 text-sm font-semibold tracking-wide mb-8 animate-fade-in-up">
                    <Sparkles className="w-4 h-4 mr-2" />
                    The Ultimate Platform Gateway
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6 animate-fade-in-up delay-100">
                    Supercharge your <br />
                    <span className="bg-gradient-to-r from-primary-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Event Communication.
                    </span>
                </h1>

                <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-200">
                    Organizing an event? This is for you. Unify Discord, Slack, WhatsApp, and Telegram into one powerful AI-driven hub.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto animate-fade-in-up delay-300">

                    {/* Create Event Card */}
                    <div
                        onClick={() => navigate('/dashboard')}
                        className="group relative p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:border-primary-500/50 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer overflow-hidden text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Create an Event</h3>
                            <p className="text-slate-400 text-sm mb-6">Start fresh. Set up your AI, connect platforms, and automate your FAQs.</p>
                            <div className="flex items-center text-primary-400 font-medium text-sm group-hover:translate-x-2 transition-transform">
                                Get Started <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </div>
                    </div>

                    {/* Join Team Card */}
                    <div
                        onClick={() => navigate('/dashboard')}
                        className="group relative p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer overflow-hidden text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Join a Team</h3>
                            <p className="text-slate-400 text-sm mb-6">Already have an invite? Log in to manage unanswered questions and settings.</p>
                            <div className="flex items-center text-indigo-400 font-medium text-sm group-hover:translate-x-2 transition-transform">
                                Log In <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Landing;
