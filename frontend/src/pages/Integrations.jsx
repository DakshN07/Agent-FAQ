import React, { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import toast, { useToaster } from 'react-hot-toast';
import { useEvent } from '../contexts/EventContext';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'YourBotUsername_bot';

// Helper component to render Telegram Widget safely
const TelegramLoginWidget = ({ callbackUrl, state }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || containerRef.current.children.length > 0) return;
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.async = true;
        script.setAttribute('data-telegram-login', TELEGRAM_BOT_NAME);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-auth-url', `${callbackUrl}?state=${state}`);
        script.setAttribute('data-request-access', 'write');
        containerRef.current.appendChild(script);
    }, [callbackUrl, state]);

    return <div ref={containerRef}></div>;
};

const IntegrationManager = () => {
    const { activeEvent } = useEvent();
    const location = useLocation();
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Handle OAuth callback alerts from URL query params
        const params = new URLSearchParams(location.search);
        const connectStatus = params.get('connect');
        const platform = params.get('platform');

        if (connectStatus === 'success') {
            toast.success(`Successfully connected ${platform}!`);
            // Clean URL gracefully
            window.history.replaceState({}, document.title, location.pathname);
        } else if (connectStatus === 'error') {
            toast.error(`Failed to connect ${platform}.`);
            window.history.replaceState({}, document.title, location.pathname);
        }
    }, [location.search]);

    useEffect(() => {
        if (activeEvent) fetchIntegrations();
    }, [activeEvent]);

    const fetchIntegrations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/events/${activeEvent._id}/integrations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIntegrations(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleConnect = (platform) => {
        if (platform === 'discord') {
            window.location.href = `${API_URL}/api/oauth/discord?state=${activeEvent._id}`;
        } else if (platform === 'slack') {
            window.location.href = `${API_URL}/api/oauth/slack?state=${activeEvent._id}`;
        }
    };

    const isConnected = (platform) => {
        const config = integrations.find(i => i.platform === platform);
        return config && config.isActive && config.credentials.token;
    };

    if (!activeEvent) return <div className="text-white">Select an event first.</div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Multi-Platform Integrations</h2>
                <p className="text-slate-400 mt-2">Connect your event's FAQ bot to external platforms.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DISCORD */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-lg p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                                <svg viewBox="0 0 127.14 96.36" fill="currentColor" className="w-8 h-8"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.73,67.73,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Discord</h3>
                        </div>
                        {isConnected('discord') ?
                            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</span> :
                            <span className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded"><AlertCircle className="w-3 h-3 mr-1" /> Not Configured</span>
                        }
                    </div>

                    <div className="flex items-start bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-6">
                        <Info className="w-4 h-4 text-primary-400 mt-0.5 mr-2 shrink-0" />
                        <p className="text-slate-400 text-sm">
                            Click below to securely authenticate and invite the AgentFAQ bot to a specific Discord server.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleConnect('discord')}
                            className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] flex justify-center items-center text-white rounded-lg font-medium transition-colors"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {isConnected('discord') ? 'Re-Connect Discord Bot' : 'Connect to Discord'}
                        </button>
                    </div>
                </div>

                {/* SLACK */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-lg p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-[#E01E5A]/20 flex items-center justify-center text-[#E01E5A] font-bold text-2xl">
                                #
                            </div>
                            <h3 className="text-xl font-bold text-white">Slack</h3>
                        </div>
                        {isConnected('slack') ?
                            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</span> :
                            <span className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded"><AlertCircle className="w-3 h-3 mr-1" /> Not Configured</span>
                        }
                    </div>
                    <div className="flex items-start bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-6">
                        <Info className="w-4 h-4 text-primary-400 mt-0.5 mr-2 shrink-0" />
                        <p className="text-slate-400 text-sm">
                            Securely authorize AgentFAQ to answer questions inside your chosen Slack workspace.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleConnect('slack')}
                            className="w-full py-3 bg-[#E01E5A] hover:bg-[#C91A51] flex items-center justify-center text-white rounded-lg font-medium transition-colors"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {isConnected('slack') ? 'Re-Connect to Slack' : 'Add to Slack'}
                        </button>
                    </div>
                </div>

                {/* TELEGRAM */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-lg p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-[#0088cc]/20 flex items-center justify-center text-[#0088cc]">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.548.295l.189-2.663 4.85-4.381c.218-.198-.046-.308-.344-.108l-6 3.778-2.583-.807c-.56-.176-.575-.562.115-.838l10.106-3.899c.46-.174.872.106.715.651z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Telegram</h3>
                        </div>
                        {isConnected('telegram') ?
                            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</span> :
                            <span className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded"><AlertCircle className="w-3 h-3 mr-1" /> Not Configured</span>
                        }
                    </div>
                    <div className="flex items-start bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-6">
                        <Info className="w-4 h-4 text-primary-400 mt-0.5 mr-2 shrink-0" />
                        <p className="text-slate-400 text-sm">
                            Make sure you've added the AgentFAQ Bot to your Telegram group as an Admin. Then use the official login widget below.
                        </p>
                    </div>

                    <div className="space-y-4 flex flex-col items-center justify-center py-4 bg-slate-900 border border-slate-700 rounded-lg">
                        <TelegramLoginWidget
                            callbackUrl={`${API_URL}/api/oauth/telegram/callback`}
                            state={activeEvent._id}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default IntegrationManager;
