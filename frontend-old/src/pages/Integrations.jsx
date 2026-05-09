import React, { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle2, AlertCircle, Info, ExternalLink, MessageCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEvent } from '../contexts/EventContext';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'YourBotUsername_bot';

// Telegram Connection Modal
const TelegramModal = ({ isOpen, onClose, onSubmit, isConnecting }) => {
    const [token, setToken] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <h3 className="text-2xl font-bold text-white mb-2">Connect Telegram Bot</h3>
                <p className="text-slate-400 text-sm mb-6">Enter your Bot Token from @BotFather.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Bot Token</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="123456789:ABCdefGHIjklMNO..."
                            className="input-premium"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
                    <button
                        onClick={() => onSubmit({ token })}
                        disabled={isConnecting || !token}
                        className="btn-primary px-5 py-2 disabled:opacity-50"
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Reusable Connection Card Component
const ConnectionCard = ({ platform, icon, title, description, isConnected, onConnect, colorClass, children }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="group relative"
        >
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${colorClass} rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500`}></div>
            <div className="relative h-full flex flex-col card-dark">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${icon.bgClass}`}>
                            {icon.element}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                            <p className="text-sm text-slate-400 font-medium capitalize">{platform} Integration</p>
                        </div>
                    </div>
                    {isConnected ?
                        <div className="flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">Active</span>
                        </div> :
                        <div className="flex items-center px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                            <span className="text-xs font-bold text-amber-500 tracking-wide uppercase">Disconnected</span>
                        </div>
                    }
                </div>

                <div className="flex-grow flex items-start bg-slate-900/40 p-4 rounded-xl border border-white/5 mb-6">
                    <Info className="w-5 h-5 text-primary-400 mt-0.5 mr-3 shrink-0" />
                    <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
                </div>

                <div className="mt-auto">
                    {children ? (
                        children
                    ) : (
                        <button
                            onClick={onConnect}
                            className={`w-full py-3.5 flex justify-center items-center text-white rounded-xl font-semibold transition-all duration-300 shadow-lg ${isConnected ? 'bg-slate-700 hover:bg-slate-600' : icon.btnClass} hover:scale-[1.02] active:scale-95`}
                        >
                            {isConnected ? (
                                <>Reconnect Settings <ArrowRight className="w-4 h-4 ml-2 opacity-70" /></>
                            ) : (
                                <>Connect {title} <ExternalLink className="w-4 h-4 ml-2 opacity-70" /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// WhatsApp Connection Modal
const WhatsappModal = ({ isOpen, onClose, onSubmit, isConnecting }) => {
    const [token, setToken] = useState('');
    const [phoneNumberId, setPhoneNumberId] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <h3 className="text-2xl font-bold text-white mb-2">Connect WhatsApp API</h3>
                <p className="text-slate-400 text-sm mb-6">Enter your Meta Cloud API details.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number ID</label>
                        <input
                            type="text"
                            value={phoneNumberId}
                            onChange={(e) => setPhoneNumberId(e.target.value)}
                            placeholder="e.g. 1029384756..."
                            className="input-premium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Permanent Access Token</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="EAAB..."
                            className="input-premium"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
                    <button
                        onClick={() => onSubmit({ token, phoneNumberId })}
                        disabled={isConnecting || !token || !phoneNumberId}
                        className="btn-primary px-5 py-2 disabled:opacity-50"
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const IntegrationManager = () => {
    const { activeEvent } = useEvent();
    const location = useLocation();
    const [integrations, setIntegrations] = useState([]);
    const [showWhatsappModal, setShowWhatsappModal] = useState(false);
    const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);

    const [showTelegramModal, setShowTelegramModal] = useState(false);
    const [isSavingTelegram, setIsSavingTelegram] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const connectStatus = params.get('connect');
        const platform = params.get('platform');

        if (connectStatus === 'success') {
            toast.success(`Successfully connected ${platform}!`, {
                icon: '🚀',
                style: { borderRadius: '12px', background: '#333', color: '#fff' }
            });
            window.history.replaceState({}, document.title, location.pathname);
        } else if (connectStatus === 'error') {
            toast.error(`Failed to connect ${platform}.`, {
                style: { borderRadius: '12px', background: '#333', color: '#fff' }
            });
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
        } else if (platform === 'whatsapp') {
            setShowWhatsappModal(true);
        } else if (platform === 'telegram') {
            setShowTelegramModal(true);
        }
    };

    const handleWhatsappSubmit = async (credentials) => {
        setIsSavingWhatsapp(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/events/${activeEvent._id}/integrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    platform: 'whatsapp',
                    isActive: true,
                    credentials
                })
            });
            if (res.ok) {
                toast.success('WhatsApp connected successfully!', { style: { borderRadius: '12px', background: '#333', color: '#fff' } });
                setShowWhatsappModal(false);
                fetchIntegrations();
            } else {
                toast.error('Failed to connect WhatsApp.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Connection error.');
        } finally {
            setIsSavingWhatsapp(false);
        }
    };

    const handleTelegramSubmit = async (credentials) => {
        setIsSavingTelegram(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/events/${activeEvent._id}/integrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    platform: 'telegram',
                    isActive: true,
                    credentials
                })
            });
            if (res.ok) {
                toast.success('Telegram connected successfully!', { style: { borderRadius: '12px', background: '#333', color: '#fff' } });
                setShowTelegramModal(false);
                fetchIntegrations();
            } else {
                toast.error('Failed to connect Telegram.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Connection error.');
        } finally {
            setIsSavingTelegram(false);
        }
    };

    const isConnected = (platform) => {
        const config = integrations.find(i => i.platform === platform);
        return config && config.isActive && config.credentials && config.credentials.token;
    };

    if (!activeEvent) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-4 border border-primary-500/30">
                <AlertCircle className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Event Selected</h2>
            <p className="text-slate-400">Please select or create an event to configure integrations.</p>
        </motion.div>
    );

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-12">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden glass rounded-3xl p-8 border border-white/5"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-3">
                        Integrations Hub
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl">
                        Deploy your AI agent across multiple platforms instantly. 1-click connect allows your bot to start answering questions immediately.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ConnectionCard
                    platform="discord"
                    title="Discord Bot"
                    description="Securely authorize AgentFAQ to join a specific Discord server. The bot will automatically reply to FAQs and learn over time."
                    isConnected={isConnected('discord')}
                    onConnect={() => handleConnect('discord')}
                    colorClass="from-[#5865F2] to-indigo-500"
                    icon={{
                        bgClass: "bg-[#5865F2]/20 text-[#5865F2]",
                        btnClass: "bg-[#5865F2] hover:bg-[#4752C4]",
                        element: <svg viewBox="0 0 127.14 96.36" fill="currentColor" className="w-7 h-7"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.73,67.73,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z" /></svg>
                    }}
                />

                <ConnectionCard
                    platform="slack"
                    title="Slack App"
                    description="Bring AgentFAQ into your workspace. It can monitor designated channels and assist team members instantly."
                    isConnected={isConnected('slack')}
                    onConnect={() => handleConnect('slack')}
                    colorClass="from-[#E01E5A] to-pink-500"
                    icon={{
                        bgClass: "bg-[#E01E5A]/20 text-[#E01E5A]",
                        btnClass: "bg-[#E01E5A] hover:bg-[#C91A51]",
                        element: <span className="font-extrabold text-3xl pb-1">#</span>
                    }}
                />

                <ConnectionCard
                    platform="telegram"
                    title="Telegram Bot"
                    description="Create a bot using @BotFather on Telegram and connect it by directly pasting its secure token."
                    isConnected={isConnected('telegram')}
                    onConnect={() => handleConnect('telegram')}
                    colorClass="from-[#0088cc] to-sky-400"
                    icon={{
                        bgClass: "bg-[#0088cc]/20 text-[#0088cc]",
                        btnClass: "bg-[#0088cc] hover:bg-[#0077b3]",
                        element: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.548.295l.189-2.663 4.85-4.381c.218-.198-.046-.308-.344-.108l-6 3.778-2.583-.807c-.56-.176-.575-.562.115-.838l10.106-3.899c.46-.174.872.106.715.651z" /></svg>
                    }}
                />

                <ConnectionCard
                    platform="whatsapp"
                    title="WhatsApp Business"
                    description="Connect via Meta Cloud API or QR Code. AgentFAQ will respond to DMs or Group Mentions seamlessly."
                    isConnected={isConnected('whatsapp')}
                    onConnect={() => handleConnect('whatsapp')}
                    colorClass="from-[#25D366] to-emerald-400"
                    icon={{
                        bgClass: "bg-[#25D366]/20 text-[#25D366]",
                        btnClass: "bg-[#25D366] hover:bg-[#1DA851] text-slate-900",
                        element: <MessageCircle className="w-7 h-7" />
                    }}
                />
            </div>
            
            <WhatsappModal
                isOpen={showWhatsappModal}
                onClose={() => setShowWhatsappModal(false)}
                onSubmit={handleWhatsappSubmit}
                isConnecting={isSavingWhatsapp}
            />

            <TelegramModal
                isOpen={showTelegramModal}
                onClose={() => setShowTelegramModal(false)}
                onSubmit={handleTelegramSubmit}
                isConnecting={isSavingTelegram}
            />
        </div>
    );
};

export default IntegrationManager;
