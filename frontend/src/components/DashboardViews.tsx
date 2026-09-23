"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, MessageSquare, Bot, Database, BarChart3, Shield, Settings, 
  Search, CheckCircle2, AlertTriangle, Send, X, ArrowUpRight, Check, Trash2, ShieldAlert,
  Edit3, Plus, RefreshCw, Sliders, Loader2
} from "lucide-react";
import { api, getStoredActiveEventId } from "@/lib/api";

interface ViewProps {
  activeTab: string;
  connectedChannels: string[];
  eventId?: string;
}

const easeCurve = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function DashboardViews({ activeTab, connectedChannels, eventId }: ViewProps) {
  const currentEventId = eventId || getStoredActiveEventId() || "default_event";

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto px-6 py-6 scrollbar-thin">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -15, filter: "blur(8px)" }}
          transition={{ ease: easeCurve, duration: 0.5 }}
          className="flex-1 flex flex-col"
        >
          {activeTab === "Overview" && <OverviewView eventId={currentEventId} connectedChannels={connectedChannels} />}
          {activeTab === "Inbox" && <InboxView eventId={currentEventId} />}
          {activeTab === "AI Agent" && <AiAgentView eventId={currentEventId} />}
          {activeTab === "Knowledge" && <KnowledgeView eventId={currentEventId} />}
          {activeTab === "Analytics" && <AnalyticsView eventId={currentEventId} />}
          {activeTab === "Moderation" && <ModerationView eventId={currentEventId} />}
          {activeTab === "Settings" && <SettingsView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// 1. OVERVIEW VIEW
function OverviewView({ eventId, connectedChannels }: { eventId: string; connectedChannels: string[] }) {
  const [stats, setStats] = useState<any>({
    totalFaqs: 0,
    matched: 0,
    unmatched: 0,
    accuracy: "—"
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await api.getAnalytics(eventId);
        if (res) {
          const total = (res.matched || 0) + (res.unmatched || 0);
          const acc = total > 0 ? `${Math.round(((res.matched || 0) / total) * 100)}%` : "—";
          setStats({
            totalFaqs: res.totalFaqs ?? 0,
            matched: res.matched ?? 0,
            unmatched: res.unmatched ?? 0,
            accuracy: acc
          });
        }
      } catch (e: any) {
        setLoadError(e?.message || "Could not load analytics");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [eventId]);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">System Dashboard</span>
        <h2 className="text-3xl font-extrabold text-white mt-1">Operations Overview</h2>
        <p className="text-sm text-gray-400">Live view of your FAQ agent's performance across connected channels.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Channels", value: connectedChannels?.length ? `${connectedChannels.length} Connected` : "0 Connected", desc: connectedChannels?.join(", ") || "No integrations yet", trend: connectedChannels?.length ? "Active" : "Setup needed" },
          { label: "AI Auto-Resolve", value: stats.accuracy, desc: `${stats.matched} queries resolved`, trend: "Live" },
          { label: "Knowledge Index", value: `${stats.totalFaqs} FAQs`, desc: `${stats.unmatched} pending review`, trend: "Synced" }
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{stat.label}</span>
            <div className="text-2xl font-bold text-white mt-2 font-mono">{stat.value}</div>
            <p className="text-xs text-gray-400 mt-1">{stat.desc}</p>
            <div className="absolute bottom-3 right-3 text-[10px] font-semibold text-emerald-400 font-mono">
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-xs text-gray-500 font-mono">Refreshing data…</p>}
      {loadError && (
        <p className="text-xs text-red-400 font-mono">Could not load analytics: {loadError}</p>
      )}
    </div>
  );
}

// 2. INBOX VIEW
interface ChatMessage {
  sender: string;
  text: string;
  time: string;
  isAi?: boolean;
}

interface Ticket {
  id: string;
  user: string;
  issue: string;
  channel: "Discord" | "Telegram" | "Slack" | "Web";
  status: "Answered" | "Pending Review" | "Pending" | "Escalated";
  time: string;
  messages: ChatMessage[];
}

function InboxView({ eventId }: { eventId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [activeChannelFilter, setActiveChannelFilter] = useState<"All" | "Discord" | "Telegram" | "Slack" | "Web">("All");

  useEffect(() => {
    if (!eventId || eventId === "default_event") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function loadConversations() {
      try {
        setLoading(true);
        setLoadError(null);
        const convs = await api.getConversations(eventId);
        if (cancelled) return;
        if (!Array.isArray(convs)) {
          setTickets([]);
          return;
        }
        const mapped: Ticket[] = convs.map((c: any) => {
          const platform = (c.platform || c.sourcePlatform || 'web').toLowerCase();
          const channel = platform.includes('discord') ? "Discord"
            : platform.includes('slack') ? "Slack"
            : platform.includes('telegram') ? "Telegram" : "Web";
          return {
            id: c._id,
            user: c.userId?.username || c.userId?.email || c.senderName || "Anonymous",
            issue: c.subject || c.lastMessage?.text || c.text || "Conversation",
            channel,
            status: c.status || "Pending",
            time: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : "",
            messages: []
          };
        });
        setTickets(mapped);
        if (mapped.length > 0 && !cancelled) {
          setSelectedTicketId((prev) => prev || mapped[0].id);
        }
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "Could not load conversations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadConversations();
    return () => { cancelled = true; };
  }, [eventId]);

  // Load messages for the selected conversation from the API.
  useEffect(() => {
    if (!eventId || !selectedTicketId || eventId === "default_event") return;

    setChatInput("");
    setTickets((prev) => prev.map((t) => t.id === selectedTicketId ? { ...t, messages: [] } : t));

    let cancelled = false;
    async function loadMessages() {
      try {
        const msgs = await api.getMessages(eventId, selectedTicketId);
        if (cancelled || !Array.isArray(msgs)) return;
        const mapped: ChatMessage[] = msgs.map((m: any) => ({
          sender: m.senderType === 'Agent' || m.isBot ? "AI Assistant"
            : m.senderType === 'User' ? (m.senderName || "User")
            : m.senderName || m.senderType || "User",
          text: m.text || m.content || "",
          time: m.createdAt ? new Date(m.createdAt).toLocaleString() : "",
          isAi: m.senderType === 'Agent' || !!m.isBot
        }));
        setTickets((prev) =>
          prev.map((t) => t.id === selectedTicketId ? { ...t, messages: mapped, status: mapped.length ? t.status : t.status } : t)
        );
      } catch {
        // Leave the message thread empty; the chat area will show an empty state.
      }
    }
    loadMessages();
    return () => { cancelled = true; };
  }, [eventId, selectedTicketId]);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  const filteredTickets = tickets.filter(
    (t) => activeChannelFilter === "All" || t.channel === activeChannelFilter
  );

  return (
    <div className="flex-1 flex gap-6 min-h-[500px]">
      
      {/* 1. Inbox Conversation List Column */}
      <div className="w-80 border-r border-white/5 pr-4 flex flex-col gap-4">
        {/* Channel Filters */}
        <div className="flex gap-1.5 p-1 bg-white/2 rounded-lg border border-white/5 text-xs">
          {(["All", "Discord", "Telegram", "Slack", "Web"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveChannelFilter(filter)}
              className={`flex-1 py-1 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                activeChannelFilter === filter ? "bg-white/5 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-center py-12 text-xs text-gray-500">Loading conversations…</div>
          ) : loadError ? (
            <div className="text-center py-12 text-xs text-red-400">{loadError}</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">
              No conversations yet. Messages from connected channels will appear here.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isActive = ticket.id === selectedTicketId;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isActive 
                      ? "bg-white/5 border-purple-500/30 text-white" 
                      : "bg-white/2 border-white/2 hover:border-white/5 text-gray-400"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-bold text-xs text-white">{ticket.user}</span>
                    <span className="text-[10px] font-mono text-gray-500">{ticket.time}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium truncate mt-1.5">{ticket.issue}</span>
                  
                  <div className="flex justify-between items-center w-full mt-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      ticket.channel === "Discord" ? "text-indigo-400" :
                      ticket.channel === "Telegram" ? "text-blue-400" : 
                      ticket.channel === "Slack" ? "text-emerald-400" : "text-gray-400"
                    }`}>{ticket.channel}</span>
                    
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      ticket.status === "Answered" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Message Log View */}
      <div className="flex-1 flex flex-col justify-between bg-black/40 border border-white/5 rounded-2xl overflow-hidden relative">
        {activeTicket ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-xs text-purple-400">
                  {activeTicket.user[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{activeTicket.user}</h4>
                  <p className="text-[10px] text-gray-400">{activeTicket.issue}</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 font-mono">
                via {activeTicket.channel}
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {activeTicket.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-8 h-8 text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500">No messages loaded for this conversation.</p>
                </div>
              ) : activeTicket.messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.isAi ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.isAi 
                      ? "bg-purple-950/20 border border-purple-500/20 text-purple-200" 
                      : "bg-white/5 border border-white/5 text-white"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-500 mt-1 font-mono">{msg.sender} • {msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/5 bg-white/2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Manual replies are not enabled yet"
                disabled
                className="w-full py-3 px-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-colors opacity-60 cursor-not-allowed"
              />
              <p className="text-[9px] text-gray-500 text-center mt-2 font-mono">
                Automated AI replies are sent through connected channels. Manual replies are coming soon.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-10 h-10 text-gray-500 mb-2" />
            <span className="text-xs text-gray-400">{loading ? "Loading conversations…" : "Select a conversation to view."}</span>
          </div>
        )}
      </div>

    </div>
  );
}

// 3. AI AGENT VIEW (ChatGPT Console)
interface ChatConsoleMessage {
  role: "user" | "agent";
  content: string;
  category?: string;
  details?: any;
}

function AiAgentView({ eventId }: { eventId: string }) {
  const [messages, setMessages] = useState<ChatConsoleMessage[]>([]);
  const [consoleInput, setConsoleInput] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerPrompt = async (prompt: string) => {
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setLoading(true);

    try {
      // Ask the backend AI service
      const res = await api.askAI(prompt);
      if (res && res.answer) {
        setMessages((prev) => [...prev, { role: "agent", content: res.answer }]);
        setLoading(false);
        return;
      }
      setMessages((prev) => [...prev, { role: "agent", content: "The AI service returned no answer. Please try again." }]);
    } catch (e: any) {
      // Never fabricate a response — surface the failure honestly.
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: `AI service unavailable${e?.message ? `: ${e.message}` : ""}. Check that the backend and AI provider are configured.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!consoleInput.trim()) return;
    triggerPrompt(consoleInput);
    setConsoleInput("");
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-black/40 border border-white/5 rounded-2xl overflow-hidden min-h-[500px]">
      {/* Console Header */}
      <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400 animate-pulse" />
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-widest">AI Console Terminal</h4>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold font-mono">STATUS: {loading ? "PROCESSING" : "ONLINE"}</span>
      </div>

      {/* Chat Terminal Log */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs select-text">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <span className="text-[9px] text-gray-500 mb-1">
              {msg.role === "user" ? "YOU" : "AGENT"}
            </span>
            <div className={`max-w-[85%] rounded-xl p-4 leading-relaxed whitespace-pre-wrap ${
              msg.role === "user" 
                ? "bg-white text-black font-semibold" 
                : "bg-white/5 border border-white/5 text-purple-200"
            }`}>
              {msg.content}

              {msg.details && msg.category === "unanswered" && (
                <div className="mt-4 p-3 bg-black/50 border border-white/5 rounded-lg space-y-2 text-[11px]">
                  <div className="text-amber-400 font-bold">⚠️ High Priority Alert</div>
                  <div className="text-gray-300">
                    Most common topic: <strong>{msg.details.commonTopic}</strong> ({msg.details.occurrences} occurrences)
                  </div>
                  <ul className="list-disc list-inside text-gray-400 pl-1 mt-1 space-y-1">
                    {msg.details.list.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {msg.details && msg.category === "spam" && (
                <div className="mt-4 p-3 bg-red-950/10 border border-red-500/20 rounded-lg space-y-2 text-[11px]">
                  <div className="text-red-400 font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Spam Warning
                  </div>
                  <div className="text-gray-300">
                    Highest Risk User: <strong>{msg.details.highRisk}</strong> on {msg.details.channel}
                  </div>
                  <div className="text-gray-400">
                    Trigger: {msg.details.count} repeated messages in last 3 minutes.
                  </div>
                  <div className="text-gray-400 italic bg-black/40 p-2 rounded border border-white/5 mt-1">
                    "{msg.details.message}"
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-purple-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Compiling agent inference...
          </div>
        )}
      </div>

      {/* Suggested Input Chips */}
      <div className="p-4 border-t border-white/5 bg-black/20 flex gap-2 overflow-x-auto">
        {[
          "Show unanswered questions",
          "Which users are spamming?",
          "Suggest new FAQs"
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => triggerPrompt(chip)}
            className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] text-gray-300 hover:text-white hover:border-white/10 transition-colors font-mono cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Console Input */}
      <div className="p-4 border-t border-white/5 bg-white/2 flex gap-3">
        <span className="self-center font-mono text-purple-400 text-sm select-none pl-1">&gt;</span>
        <input
          type="text"
          value={consoleInput}
          onChange={(e) => setConsoleInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type console command or prompt..."
          className="flex-1 py-3 px-2 bg-transparent text-xs text-white placeholder:text-gray-600 focus:outline-none font-mono"
        />
        <button 
          onClick={handleSend}
          className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-purple-500/10"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// 4. KNOWLEDGE BASE VIEW (FAQ CRUD)
interface FAQItem {
  id: string;
  q: string;
  a: string;
  usage?: number;
  confidence?: number;
  lastUpdated?: string;
  platforms?: string[];
}

interface FAQSuggestion {
  id: string;
  q: string;
  count: number;
}

function KnowledgeView({ eventId }: { eventId: string }) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [suggestions, setSuggestions] = useState<FAQSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const data = await api.getFaqs(eventId);
        if (Array.isArray(data) && data.length > 0) {
          setFaqs(data.map((f: any) => ({
            id: f._id || f.id,
            q: f.question,
            a: f.answer,
            usage: f.count || 0,
            confidence: f.confidence ?? undefined,
            lastUpdated: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : undefined,
            platforms: f.platforms || []
          })));
        } else {
          setFaqs([]);
        }
      } catch (e: any) {
        setActionError(e?.message || "Could not load FAQs");
      }

      try {
        const suggData = await api.getSuggestions(eventId);
        if (Array.isArray(suggData) && suggData.length > 0) {
          setSuggestions(suggData.map((s: any) => ({
            id: s._id || s.id,
            q: s.text || s.question,
            count: s.count || 1
          })));
        } else {
          setSuggestions([]);
        }
      } catch {
        // suggestions simply stay empty
      }
    }
    loadFaqs();
  }, [eventId]);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faq.a || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveFaq = async () => {
    if (!editingFaq || !editingFaq.q.trim() || !editingFaq.a.trim()) return;
    setIsSaving(true);
    setActionError(null);

    try {
      if (editingFaq.id === "new") {
        const created = await api.createFaq({
          eventId,
          question: editingFaq.q,
          answer: editingFaq.a,
          platforms: editingFaq.platforms || []
        });
        const newFaq: FAQItem = {
          id: created?._id || String(Date.now()),
          q: editingFaq.q,
          a: editingFaq.a,
          usage: 0,
          confidence: undefined,
          lastUpdated: "Just now",
          platforms: editingFaq.platforms || []
        };
        setFaqs([newFaq, ...faqs]);
      } else {
        await api.updateFaq(editingFaq.id, {
          question: editingFaq.q,
          answer: editingFaq.a,
          platforms: editingFaq.platforms
        });
        setFaqs(faqs.map(f => f.id === editingFaq.id ? { ...f, q: editingFaq.q, a: editingFaq.a } : f));
      }
    } catch (err: any) {
      // Never fake a save — surface the error to the user.
      setActionError(err?.message || "Could not save the FAQ. Please try again.");
    } finally {
      setIsSaving(false);
      setEditingFaq(null);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await api.deleteFaq(id);
    } catch (e: any) {
      setActionError(e?.message || "Could not delete the FAQ.");
      return;
    }
    setFaqs(faqs.filter(f => f.id !== id));
  };

  const handleApprove = async (s: FAQSuggestion) => {
    const newFaq: FAQItem = {
      id: String(Date.now()),
      q: s.q,
      a: "",
      usage: s.count,
      confidence: undefined,
      lastUpdated: "Just now",
      platforms: []
    };

    try {
      const created = await api.createFaq({
        eventId,
        question: newFaq.q,
        answer: newFaq.a,
        platforms: newFaq.platforms
      });
      newFaq.id = created?._id || newFaq.id;
      newFaq.a = created?.answer || "";
    } catch (e: any) {
      setActionError(e?.message || "Could not approve this suggestion.");
      return;
    }

    setFaqs((prev) => [newFaq, ...prev]);
    setSuggestions((prev) => prev.filter((item) => item.id !== s.id));
  };

  const handleReject = (id: string) => {
    setSuggestions((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search FAQ database..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <button 
          onClick={() => setEditingFaq({ id: "new", q: "", a: "", usage: 0, confidence: undefined, lastUpdated: "Just now", platforms: [] })}
          className="px-4 py-2 bg-white text-black font-semibold rounded-xl text-xs hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Manual FAQ
        </button>
      </div>

      {actionError && (
        <p className="text-xs text-red-400 font-mono">{actionError}</p>
      )}

      {/* Suggested FAQ Area (Human Ingestion queue) */}
      {suggestions.length > 0 && (
        <div className="p-5 bg-purple-950/10 border border-purple-500/10 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            AI Suggestion Queue
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestions.map((s) => (
              <div key={s.id} className="bg-black/60 border border-white/5 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white leading-relaxed">{s.q}</h4>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">
                    Asked {s.count} times in support channels
                  </p>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => handleReject(s.id)}
                    className="px-2.5 py-1.5 bg-white/2 border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-gray-400 hover:text-red-400 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(s)}
                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current FAQ Inventory Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Database Inventory ({filteredFaqs.length})</h3>
        
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-500">
            No FAQ answers found in local vector storage.
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div key={faq.id} className="glass-card rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white">{faq.q}</h4>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{faq.a}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2 flex-shrink-0 text-right font-mono text-[10px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingFaq(faq)}
                      className="p-1 text-gray-500 hover:text-purple-400 transition-colors cursor-pointer"
                      title="Edit FAQ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {faq.confidence != null ? `${faq.confidence}% Conf.` : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual FAQ Modal (New or Edit) */}
      {editingFaq && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">
                {editingFaq.id === "new" ? "Add New FAQ" : "Edit FAQ"}
              </h3>
              <button onClick={() => setEditingFaq(null)} className="text-gray-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Question</label>
                <input
                  type="text"
                  value={editingFaq.q}
                  onChange={(e) => setEditingFaq({ ...editingFaq, q: e.target.value })}
                  placeholder="e.g. How do I clear cookies?"
                  className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Answer</label>
                <textarea
                  rows={4}
                  value={editingFaq.a}
                  onChange={(e) => setEditingFaq({ ...editingFaq, a: e.target.value })}
                  placeholder="Explain resolution details..."
                  className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button 
                onClick={() => setEditingFaq(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                disabled={isSaving}
                onClick={handleSaveFaq}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save FAQ
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

// 5. ANALYTICS VIEW
function AnalyticsView({ eventId }: { eventId: string }) {
  const [data, setData] = useState<any>({
    totalQueries: 0,
    resolvedRate: "—",
    escalatedRate: "—",
    perPlatform: { discord: 0, telegram: 0, slack: 0, web: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await api.getAnalytics(eventId);
        if (res) {
          const total = (res.totalQueries || 0);
          const resolved = total > 0 ? `${Math.round(((res.matched || 0) / total) * 100)}%` : "—";
          const escalated = total > 0 ? `${Math.round(((res.unmatched || 0) / total) * 100)}%` : "—";
          setData({
            totalQueries: total,
            resolvedRate: resolved,
            escalatedRate: escalated,
            perPlatform: res.perPlatform || { discord: 0, telegram: 0, slack: 0, web: 0 }
          });
        }
      } catch (e: any) {
        setLoadError(e?.message || "Could not load analytics");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [eventId]);

  const channelData = [
    { name: "Discord", share: data.perPlatform?.discord || 0, color: "bg-indigo-500" },
    { name: "Telegram", share: data.perPlatform?.telegram || 0, color: "bg-blue-500" },
    { name: "Slack", share: data.perPlatform?.slack || 0, color: "bg-emerald-500" },
    { name: "Web", share: data.perPlatform?.web || 0, color: "bg-purple-500" }
  ];

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Queries", value: data.totalQueries.toLocaleString(), trend: "All-time", isGreen: true },
          { label: "Resolved by AI Bot", value: data.resolvedRate, trend: "Match rate", isGreen: true },
          { label: "Escalated to Humans", value: data.escalatedRate, trend: "Unmatched rate", isGreen: false }
        ].map((card, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 border border-white/5 relative">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{card.label}</span>
            <div className="text-3xl font-extrabold text-white mt-2 font-mono">{card.value}</div>
            <div className={`text-[10px] font-mono mt-1 ${card.isGreen ? "text-emerald-400" : "text-amber-400"}`}>
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-xs text-gray-500 font-mono">Loading analytics…</p>}
      {loadError && <p className="text-xs text-red-400 font-mono">Could not load analytics: {loadError}</p>}

      {/* Platform Breakdown */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Platform Query Distribution</h3>
        {data.totalQueries === 0 && !loading ? (
          <p className="text-xs text-gray-500 font-mono">No analytics recorded yet for this event.</p>
        ) : (
          <div className="space-y-3">
            {channelData.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-300">{c.name}</span>
                  <span className="text-gray-400">{c.share}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 6. MODERATION VIEW
interface FlaggedUser {
  id: string;
  name: string;
  platform: string;
  reason: string;
  severity: "High" | "Medium" | "Low";
  status: "Flagged" | "Blocked" | "Dismissed";
}

function ModerationView({ eventId }: { eventId: string }) {
  const [toxicUsers, setToxicUsers] = useState<FlaggedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<"Toxic" | "Spammer" | "Injection">("Toxic");

  useEffect(() => {
    let cancelled = false;
    async function loadModeration() {
      try {
        setLoading(true);
        setLoadError(null);
        const events = await api.getModerationEvents(eventId);
        if (cancelled) return;
        if (Array.isArray(events) && events.length > 0) {
          setToxicUsers(events.map((e: any, idx: number) => ({
            id: e._id || String(idx),
            name: e.userId?.username || e.user || `User_${idx}`,
            platform: e.platform || "Web",
            reason: e.reason || "Policy violation",
            severity: e.severity || "Medium",
            status: e.status || "Flagged"
          })));
        } else {
          setToxicUsers([]);
        }
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "Could not load moderation events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadModeration();
    return () => { cancelled = true; };
  }, [eventId]);

  const handleAction = (id: string, action: "Blocked" | "Dismissed") => {
    setToxicUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, status: action } : user))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 font-mono">Moderation Center</span>
        <h2 className="text-3xl font-extrabold text-white mt-1">Moderation Queue</h2>
        <p className="text-sm text-gray-400">Flagged users and messages detected across connected channels.</p>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500 font-mono">Loading moderation events…</p>
      ) : loadError ? (
        <p className="text-xs text-red-400 font-mono">Could not load moderation events: {loadError}</p>
      ) : toxicUsers.filter(u => u.status === "Flagged").length === 0 ? (
        <p className="text-xs text-gray-500 font-mono">No flagged activity to review.</p>
      ) : (
        <>
          {/* Flagged user table */}
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Flagged Users ({toxicUsers.filter(u => u.status === "Flagged").length})
              </h4>
              <span className="text-[10px] text-gray-500 font-mono">Live from moderation pipeline</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 text-[10px] uppercase font-bold bg-white/1">
                    <th className="p-4">User</th>
                    <th className="p-4">Platform</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {toxicUsers.filter(u => u.status === "Flagged").map((user) => (
                    <tr key={user.id} className="border-b border-white/2 hover:bg-white/1 transition-all">
                      <td className="p-4 text-white font-bold">{user.name}</td>
                      <td className="p-4 text-gray-400">{user.platform}</td>
                      <td className="p-4 text-gray-400 max-w-xs truncate">{user.reason}</td>
                      <td className="p-4">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          user.severity === "High" ? "bg-red-500/10 text-red-400" :
                          user.severity === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {user.severity}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(user.id, "Dismissed")}
                          className="px-2.5 py-1.5 bg-white/2 hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleAction(user.id, "Blocked")}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-semibold transition-colors cursor-pointer shadow-md"
                        >
                          Block User
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 7. SETTINGS VIEW
function SettingsView() {
  const [similarityThreshold, setSimilarityThreshold] = useState(0.85);
  const [autoRespond, setAutoRespond] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await api.getSettings();
        if (s) {
          if (s.similarityThreshold !== undefined) setSimilarityThreshold(s.similarityThreshold);
          if (s.autoRespond !== undefined) setAutoRespond(s.autoRespond);
          if (s.notificationEmail) setNotificationEmail(s.notificationEmail);
        }
      } catch (e) {
        // Global settings are loaded lazily; leave defaults if unavailable.
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await api.updateSettings({
        similarityThreshold,
        autoRespond,
        notificationEmail
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: any) {
      // Never show success when the save failed.
      setSaveError(e?.message || "Could not save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 font-mono">System Configuration</span>
        <h2 className="text-2xl font-bold text-white mt-1">General Settings</h2>
        <p className="text-xs text-gray-400 mt-1">Manage AI behaviors, deployment scopes, and database indexing.</p>
      </div>

      <div className="space-y-4">
        {/* Similarity slider */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Agent Response Thresholds</h3>
          
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Confidence Auto-Answer Cutoff</span>
              <span className="text-white font-mono font-bold">{Math.round(similarityThreshold * 100)}% Confidence</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="0.99" 
              step="0.01" 
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <p className="text-[10px] text-gray-500 font-mono">
              Queries resolved below this confidence level route directly to human validation queues.
            </p>
          </div>
        </div>

        {/* Auto respond toggle */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">Autonomous Auto-Reply</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">Automatically reply to users on Discord, Telegram, and Slack.</p>
          </div>
          <button 
            onClick={() => setAutoRespond(!autoRespond)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${autoRespond ? 'bg-purple-600' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${autoRespond ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-2">
          {saveError && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {saveError}
            </span>
          )}
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved successfully
            </span>
          )}
          <button 
            disabled={isSaving}
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
