import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users,
  MessageCircle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Plus
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEvent } from '../contexts/EventContext';
import CreateEventModal from '../components/CreateEventModal';
import JoinEventModal from '../components/JoinEventModal';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Dashboard = () => {
  const { events, activeEvent, loading: contextLoading, refreshEvents } = useEvent();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Empty state handling
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.action) {
      if (location.state.action === 'create') {
        setIsCreateModalOpen(true);
      } else if (location.state.action === 'join') {
        setIsJoinModalOpen(true);
      }
      // Clear state so it doesn't re-trigger on unmount/remount
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    async function fetchStats() {
      if (!activeEvent) {
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/analytics?eventId=${activeEvent._id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [activeEvent]);

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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: joinCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshEvents();
      // Optional: show toast success
    } catch (err) {
      console.error(err.message);
      // Optional: show toast error
    } finally {
      setJoining(false);
    }
  };

  const chartData = stats?.chartData || [
    { name: 'Mon', queries: 0 },
    { name: 'Tue', queries: 0 },
    { name: 'Wed', queries: 0 },
    { name: 'Thu', queries: 0 },
    { name: 'Fri', queries: 0 },
    { name: 'Sat', queries: 0 },
    { name: 'Sun', queries: 0 },
  ];

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass }) => (
    <motion.div variants={itemVariants} className="relative group">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${colorClass.replace('bg-', 'from-').replace('500', '500 to-primary-500')} rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500`}></div>
      <div className="relative h-full glass p-6 rounded-2xl transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20 group-hover:scale-110 shadow-inner transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
              {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
              {trendValue}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">{value}</h3>
          <p className="text-sm font-medium text-slate-400 mt-2">{title}</p>
        </div>
      </div>
    </motion.div>
  );

  if (contextLoading || (loading && activeEvent)) {
    return <div className="flex items-center justify-center min-h-[50vh]"><span className="text-slate-400">Loading Dashboard...</span></div>;
  }

  if (!activeEvent || events.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in text-center">
        <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">Welcome to AgentFAQ Workspace</h2>
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">Get started by creating a new event workspace or joining an existing one with an invite code.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Event Block */}
          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 shadow-lg text-left hover:border-primary-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center mb-6">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Create New Event</h3>
            <p className="text-slate-400 text-sm mb-8">Setup a new AI Assistant workspace from scratch. Generate your first FAQs automatically.</p>
            <button onClick={() => setIsCreateModalOpen(true)} className="w-full btn-primary bg-primary-600 hover:bg-primary-500">
              Create Event Sandbox
            </button>
          </div>

          {/* Join Event Block */}
          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 shadow-lg text-left hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Join a Team</h3>
            <p className="text-slate-400 text-sm mb-6">Enter your 6-digit access code provided by the event organizer.</p>
            <button onClick={() => setIsJoinModalOpen(true)} className="w-full btn-primary bg-indigo-600 hover:bg-indigo-500 mt-2">
              Enter Access Code
            </button>
          </div>
        </div>

        <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        <JoinEventModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Overview</h2>
          <p className="text-slate-400 mt-2 text-lg">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live updates active</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Questions"
          value={stats?.totalQueries || '0'}
          icon={MessageCircle}
          trend="up"
          trendValue="Live"
          colorClass="bg-blue-500"
        />
        <StatCard
          title="Matched FAQs"
          value={stats?.matched || '0'}
          icon={CheckCircle2}
          trend="up"
          trendValue="Live"
          colorClass="bg-emerald-500"
        />
        <StatCard
          title="Unanswered"
          value={stats?.unmatched || '0'}
          icon={HelpCircle}
          trend="down"
          trendValue="Live"
          colorClass="bg-amber-500"
        />
        <StatCard
          title="Users Engaged"
          value={stats?.uniqueUsers || '0'}
          icon={Users}
          trend="up"
          trendValue="Live"
          colorClass="bg-violet-500"
        />
      </div>

      {/* Platform Breakdown */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="glass p-4 rounded-xl flex items-center justify-between col-span-1 md:col-start-1 group hover:border-primary-500/50 transition-colors">
          <span className="text-slate-400 font-medium flex items-center"><span className="w-2 h-2 rounded-full bg-[#5865F2] mr-2"></span> Discord API</span>
          <span className="text-white font-bold group-hover:text-primary-400 transition-colors">{stats?.perPlatform?.discord || 0} msgs</span>
        </div>
        <div className="glass p-4 rounded-xl flex items-center justify-between group hover:border-pink-500/50 transition-colors">
          <span className="text-slate-400 font-medium flex items-center"><span className="w-2 h-2 rounded-full bg-[#E01E5A] mr-2"></span> Slack API</span>
          <span className="text-white font-bold group-hover:text-pink-400 transition-colors">{stats?.perPlatform?.slack || 0} msgs</span>
        </div>
        <div className="glass p-4 rounded-xl flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
          <span className="text-slate-400 font-medium flex items-center"><span className="w-2 h-2 rounded-full bg-[#25D366] mr-2"></span> WhatsApp API</span>
          <span className="text-white font-bold group-hover:text-emerald-400 transition-colors">{stats?.perPlatform?.whatsapp || 0} msgs</span>
        </div>
        <div className="glass p-4 rounded-xl flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
          <span className="text-slate-400 font-medium flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span> Web / Manual</span>
          <span className="text-white font-bold group-hover:text-indigo-400 transition-colors">{stats?.perPlatform?.web || 0} msgs</span>
        </div>
      </motion.div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Activity Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Activity Trends</h3>
              <p className="text-sm text-slate-400">Daily question volume</p>
            </div>
            <select className="bg-slate-900 border border-white/10 text-sm font-medium text-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary-500/50 shadow-inner">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                    padding: '12px'
                  }}
                  itemStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="queries"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorQueries)"
                />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Recent Live Feed</h3>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {(stats?.pendingQuestions || []).slice(0, 5).map((q, i) => (
              <div key={i} className="flex items-start space-x-4 group">
                <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-700 group-hover:border-primary-500/50 transition-colors">
                  <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{q.question}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs text-slate-500 capitalize">{q.sourcePlatform || 'web'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Unanswered</span>
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.pendingQuestions || stats.pendingQuestions.length === 0) && (
              <div className="text-sm text-slate-500 text-center mt-10">No recent questions!</div>
            )}
          </div>
          <button onClick={() => window.location.href = '/activity'} className="w-full mt-6 py-3.5 text-sm font-semibold text-slate-300 bg-slate-800/80 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center border border-white/5 shadow-sm group">
            View All History <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </motion.div>
      </div>
      <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <JoinEventModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
    </motion.div>
  );
};

export default Dashboard;
