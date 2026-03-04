import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEvent } from '../contexts/EventContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const IntegrationManager = () => {
    const { activeEvent } = useEvent();
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [discordToken, setDiscordToken] = useState('');
    const [slackToken, setSlackToken] = useState('');
    const [whatsappToken, setWhatsappToken] = useState('');
    const [telegramToken, setTelegramToken] = useState('');

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

                // Pre-fill forms
                const discord = data.find(i => i.platform === 'discord');
                const slack = data.find(i => i.platform === 'slack');
                const whatsapp = data.find(i => i.platform === 'whatsapp');
                const telegram = data.find(i => i.platform === 'telegram');

                if (discord) setDiscordToken(discord.credentials.token || '');
                if (slack) setSlackToken(slack.credentials.token || '');
                if (whatsapp) setWhatsappToken(whatsapp.credentials.token || '');
                if (telegram) setTelegramToken(telegram.credentials.token || '');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (platform, tokenValue) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/events/${activeEvent._id}/integrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    platform,
                    credentials: { token: tokenValue },
                    isActive: true
                })
            });
            if (!res.ok) throw new Error("Failed to save integration");
            toast.success(`${platform} configuration saved!`);
            fetchIntegrations();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
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
                            Go to Discord Developer Portal, create an App & Bot, enable all Intents, and paste the Token below.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="Bot Token"
                            value={discordToken}
                            onChange={(e) => setDiscordToken(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#5865F2] outline-none"
                        />
                        <button
                            disabled={loading || !discordToken}
                            onClick={() => handleSave('discord', discordToken)}
                            className="w-full py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Save Configuration
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
                            Create a Slack App, add Bot Token Scopes, install to workspace, and paste the <b>xoxb-</b> token below.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="xoxb-your-token"
                            value={slackToken}
                            onChange={(e) => setSlackToken(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#E01E5A] outline-none"
                        />
                        <button
                            disabled={loading || !slackToken}
                            onClick={() => handleSave('slack', slackToken)}
                            className="w-full py-2.5 bg-[#E01E5A] hover:bg-[#C91A51] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Save Configuration
                        </button>
                    </div>
                </div>

                {/* WHATSAPP */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-lg p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.264.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">WhatsApp</h3>
                        </div>
                        {isConnected('whatsapp') ?
                            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</span> :
                            <span className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded"><AlertCircle className="w-3 h-3 mr-1" /> Not Configured</span>
                        }
                    </div>
                    <div className="flex items-start bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-6">
                        <Info className="w-4 h-4 text-primary-400 mt-0.5 mr-2 shrink-0" />
                        <p className="text-slate-400 text-sm">
                            Register a Meta Developer App, setup WhatsApp Cloud API, and paste your Temporary or Permanent Access Token below.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="WA API Token"
                            value={whatsappToken}
                            onChange={(e) => setWhatsappToken(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#25D366] outline-none"
                        />
                        <button
                            disabled={loading || !whatsappToken}
                            onClick={() => handleSave('whatsapp', whatsappToken)}
                            className="w-full py-2.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Save Configuration
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
                            Message @BotFather on Telegram, type /newbot, follow the steps, and paste the HTTP API Token below.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            value={telegramToken}
                            onChange={(e) => setTelegramToken(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#0088cc] outline-none"
                        />
                        <button
                            disabled={loading || !telegramToken}
                            onClick={() => handleSave('telegram', telegramToken)}
                            className="w-full py-2.5 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Save Configuration
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default IntegrationManager;
