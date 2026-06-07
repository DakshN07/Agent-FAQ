"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, MessageSquare, Bot, Database, BarChart3, Shield, Settings, 
  Search, CheckCircle2, AlertTriangle, Send, X, ArrowUpRight, Check, Trash2, ShieldAlert
} from "lucide-react";

interface ViewProps {
  activeTab: string;
  connectedChannels: string[];
}

const easeCurve = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function DashboardViews({ activeTab, connectedChannels }: ViewProps) {

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
          {activeTab === "Overview" && <OverviewView />}
          {activeTab === "Inbox" && <InboxView />}
          {activeTab === "AI Agent" && <AiAgentView />}
          {activeTab === "Knowledge" && <KnowledgeView />}
          {activeTab === "Analytics" && <AnalyticsView />}
          {activeTab === "Moderation" && <ModerationView />}
          {activeTab === "Settings" && <SettingsView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// 1. OVERVIEW VIEW
function OverviewView() {
  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">System Dashboard</span>
        <h2 className="text-3xl font-extrabold text-white mt-1">Autonomous Operations</h2>
        <p className="text-sm text-gray-400">AI Support Agent is monitorizing all active incoming pipeline streams.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active Pipelines", value: "3 Active", desc: "Discord, Telegram, WhatsApp", trend: "Optimal" },
          { label: "AI Auto-Resolve", value: "89.4%", desc: "19,842 Tickets resolved", trend: "+1.2% this week" },
          { label: "Avg Execution Time", value: "1.4 sec", desc: "Embedding & generation time", trend: "-240ms latency" }
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

      {/* Status Bulletin */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Autonomous Action Log
        </h3>
        
        <div className="space-y-3 font-mono text-xs">
          {[
            { time: "17:40:12", status: "INFO", message: "Successfully synced Discord thread #support-ticket-489" },
            { time: "17:38:45", status: "RESOLVE", message: "Resolved 'How do I cancel my subscription?' with 98% confidence on WhatsApp" },
            { time: "17:35:22", status: "MODERATION", message: "Flagged user @user123 for excessive repetition (67 messages) on Discord" },
            { time: "17:32:01", status: "LEARN", message: "Draft FAQ ingested from Slack discussions regarding 'API keys configuration'" }
          ].map((log, i) => (
            <div key={i} className="flex gap-4 p-2.5 rounded-lg bg-white/2 border border-white/2 select-none hover:bg-white/5 transition-colors">
              <span className="text-gray-500">{log.time}</span>
              <span className={`font-bold ${
                log.status === "RESOLVE" ? "text-emerald-400" :
                log.status === "MODERATION" ? "text-amber-400" :
                log.status === "LEARN" ? "text-blue-400" : "text-gray-400"
              }`}>{log.status}</span>
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. INBOX VIEW (Intercom style)
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
  channel: "Discord" | "Telegram" | "WhatsApp";
  status: "Answered" | "Pending Review";
  time: string;
  messages: ChatMessage[];
}

function InboxView() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "1",
      user: "John Doe",
      issue: "Password reset link is broken",
      channel: "Discord",
      status: "Pending Review",
      time: "2m ago",
      messages: [
        { sender: "John Doe", text: "Hey support! The password reset link you emailed me returns a 404.", time: "2m ago" },
        { sender: "AI Assistant", text: "Hi John! I've checked the link generator. Please try requests with a fresh token. Let me know if that works.", time: "1m ago", isAi: true }
      ]
    },
    {
      id: "2",
      user: "Aisha Patel",
      issue: "Do you support Stripe payment methods?",
      channel: "Telegram",
      status: "Answered",
      time: "12m ago",
      messages: [
        { sender: "Aisha Patel", text: "Hello, looking to pay with Stripe, is that supported?", time: "15m ago" },
        { sender: "AI Assistant", text: "Yes! We support credit cards, Apple Pay, and Google Pay through Stripe billing.", time: "12m ago", isAi: true }
      ]
    },
    {
      id: "3",
      user: "Liam Johnson",
      issue: "Refunding order #1085",
      channel: "WhatsApp",
      status: "Pending Review",
      time: "18m ago",
      messages: [
        { sender: "Liam Johnson", text: "I need to refund order #1085. It has been three days and it hasn't shipped.", time: "18m ago" }
      ]
    }
  ]);

  const [selectedTicketId, setSelectedTicketId] = useState<string>("1");
  const [chatInput, setChatInput] = useState("");

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  const [activeChannelFilter, setActiveChannelFilter] = useState<"All" | "Discord" | "Telegram" | "WhatsApp">("All");

  const filteredTickets = tickets.filter(
    (t) => activeChannelFilter === "All" || t.channel === activeChannelFilter
  );

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === activeTicket.id) {
          return {
            ...t,
            status: "Answered",
            messages: [...t.messages, { sender: "You", text: chatInput, time: "Just now" }]
          };
        }
        return t;
      })
    );
    setChatInput("");
  };

  const approveAiDraft = () => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === activeTicket.id) {
          return { ...t, status: "Answered" };
        }
        return t;
      })
    );
  };

  return (
    <div className="flex-1 flex gap-4 min-h-[500px]">
      
      {/* 1. Inbox Conversation List Column */}
      <div className="w-80 border-r border-white/5 pr-4 flex flex-col gap-4">
        {/* Channel Filters */}
        <div className="flex gap-1.5 p-1 bg-white/2 rounded-lg border border-white/5 text-xs">
          {(["All", "Discord", "Telegram", "WhatsApp"] as const).map((filter) => (
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
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">
              No conversations in this stream.
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
                      ticket.channel === "Telegram" ? "text-blue-400" : "text-green-400"
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

      {/* 2. Interactive Message Log View */}
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
              {activeTicket.messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === "You" || msg.isAi ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.isAi 
                      ? "bg-purple-950/20 border border-purple-500/20 text-purple-200" 
                      : msg.sender === "You" 
                        ? "bg-white text-black font-medium" 
                        : "bg-white/5 border border-white/5 text-white"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-500 mt-1 font-mono">{msg.sender} • {msg.time}</span>
                </div>
              ))}
            </div>

            {/* Floating review suggestion if pending */}
            {activeTicket.status === "Pending Review" && (
              <div className="mx-4 mb-3 p-4 bg-purple-950/10 border border-purple-500/20 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400 animate-pulse" />
                  <div>
                    <h5 className="text-[11px] font-bold text-white">AI Response Draft Ready</h5>
                    <p className="text-[10px] text-gray-400">Review drafted answer to auto-send and update system FAQs.</p>
                  </div>
                </div>
                <button 
                  onClick={approveAiDraft}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-[10px] shadow-md transition-colors cursor-pointer"
                >
                  Approve Response
                </button>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 border-t border-white/5 bg-white/2 flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Reply to ${activeTicket.user} directly...`}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 py-3 px-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button 
                onClick={sendMessage}
                className="p-3 bg-white text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-10 h-10 text-gray-500 mb-2" />
            <span className="text-xs text-gray-400">Select a conversation to reply.</span>
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

function AiAgentView() {
  const [messages, setMessages] = useState<ChatConsoleMessage[]>([
    {
      role: "agent",
      content: "AI Operating System active. Use chips below or type queries like:\n- Show unanswered questions\n- Which users are spamming?\n- Suggest new FAQ guidelines"
    }
  ]);
  const [consoleInput, setConsoleInput] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerPrompt = (prompt: string) => {
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setLoading(true);

    setTimeout(() => {
      let response: ChatConsoleMessage = { role: "agent", content: "" };
      const normalized = prompt.toLowerCase();

      if (normalized.includes("unanswered")) {
        response.content = "There are currently 15 unanswered questions across all ingestion streams.";
        response.category = "unanswered";
        response.details = {
          commonTopic: "Payment Failure",
          occurrences: 12,
          list: ["Stripe card declines", "Invoice download issue", "Paypal routing error"]
        };
      } else if (normalized.includes("spam")) {
        response.content = "Detected 4 active users flagged for spamming/repetition.";
        response.category = "spam";
        response.details = {
          highRisk: "User123",
          channel: "Discord",
          count: 67,
          message: "'Need pricing details now!' repeated in 14 support channels."
        };
      } else {
        response.content = `Understood. Analyzing parameters for query: "${prompt}". Confidence score: 94.2%. Standard FAQ logic is operational. Connect webhook logs to parse production vectors.`;
      }

      setMessages((prev) => [...prev, response]);
      setLoading(false);
    }, 1200);
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
        <span className="text-[10px] text-emerald-400 font-bold font-mono">STATUS: ONLINE</span>
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

              {/* Special interactive detail cards rendered inside response */}
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

// 4. KNOWLEDGE BASE VIEW (Notion style)
interface FAQItem {
  id: string;
  q: string;
  a: string;
  usage: number;
  confidence: number;
  lastUpdated: string;
}

interface FAQSuggestion {
  id: string;
  q: string;
  count: number;
}

function KnowledgeView() {
  const [faqs, setFaqs] = useState<FAQItem[]>([
    { id: "1", q: "How do I upgrade to the developer subscription?", a: "Go to Billing Settings page and click Upgrade Plan. We support Stripe card payments.", usage: 142, confidence: 99.4, lastUpdated: "2d ago" },
    { id: "2", q: "Can I connect multiple Discord bots?", a: "Yes, you can register secondary bots under the integrations panel.", usage: 89, confidence: 98.2, lastUpdated: "5d ago" },
    { id: "3", q: "Where can I view API documentation?", a: "The official API schemas are available in /api-docs endpoint.", usage: 67, confidence: 95.8, lastUpdated: "1d ago" }
  ]);

  const [suggestions, setSuggestions] = useState<FAQSuggestion[]>([
    { id: "s1", q: "What is your refund policy?", count: 37 },
    { id: "s2", q: "How to export telemetry reports?", count: 18 }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = (s: FAQSuggestion) => {
    // Add to FAQ list, remove from suggestion list
    const newFaq: FAQItem = {
      id: String(Date.now()),
      q: s.q,
      a: "Update this FAQ answer. Approved draft based on user queries.",
      usage: s.count,
      confidence: 90.0,
      lastUpdated: "Just now"
    };

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
          onClick={() => setEditingFaq({ id: "new", q: "", a: "", usage: 0, confidence: 100, lastUpdated: "Just now" })}
          className="px-4 py-2 bg-white text-black font-semibold rounded-xl text-xs hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Database className="w-3.5 h-3.5" />
          Add Manual FAQ
        </button>
      </div>

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
                    Asked {s.count} times in various support channels
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Database Inventory</h3>
        
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-500">
            No FAQ answers found in local vector storage.
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div key={faq.id} className="glass-card rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">{faq.q}</h4>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{faq.a}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 text-right font-mono text-[10px] text-gray-500">
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {faq.confidence}% Conf.
                  </span>
                  <span>Used: {faq.usage} times</span>
                  <span>Sync: {faq.lastUpdated}</span>
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
              <h3 className="text-sm font-bold text-white">Add New FAQ</h3>
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
                onClick={() => {
                  if (!editingFaq.q || !editingFaq.a) return;
                  setFaqs((prev) => [editingFaq, ...prev]);
                  setEditingFaq(null);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
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
function AnalyticsView() {
  const channelData = [
    { name: "Discord", share: 42, color: "bg-indigo-500" },
    { name: "Telegram", share: 31, color: "bg-blue-500" },
    { name: "WhatsApp", share: 18, color: "bg-green-500" },
    { name: "Slack", share: 9, color: "bg-emerald-500" }
  ];

  // Message volumes mapped for heatmap grid (Monday, Tuesday, Wednesday: 24 hourly values represented)
  const heatmapGrid = Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 12 }, (_, col) => {
      // Mock data densities
      const dayVal = row === 0 ? "Mon" : row === 1 ? "Tue" : "Wed";
      const val = Math.floor(Math.sin((col / 12) * Math.PI) * 100) + Math.floor(Math.random() * 30);
      return { day: dayVal, hour: col * 2, weight: Math.max(10, val) };
    })
  );

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Ingested Messages", value: "23,451", trend: "+17%", isGreen: true },
          { label: "Resolved by AI Bot", value: "89%", trend: "Optimal Accuracy", isGreen: true },
          { label: "Escalated to Humans", value: "11%", trend: "1,248 Tickets", isGreen: false }
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

      {/* Heatmap Grid */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Weekly Message Volume Density</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Peak traffic ingestion heatmap mapped by day and interval.</p>
        </div>

        <div className="space-y-2">
          {heatmapGrid.map((dayRow, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-2">
              <span className="w-8 text-[10px] font-mono text-gray-500">{dayRow[0].day}</span>
              <div className="flex-1 grid grid-cols-12 gap-1.5">
                {dayRow.map((cell, cellIdx) => {
                  // Classname opacity levels depending on weight
                  const opacity = cell.weight > 100 ? "bg-purple-500" :
                                  cell.weight > 70 ? "bg-purple-600/80" :
                                  cell.weight > 40 ? "bg-purple-700/50" : "bg-purple-950/20";
                  return (
                    <div
                      key={cellIdx}
                      className={`h-7 rounded-md ${opacity} border border-white/5 hover:border-white/20 transition-all cursor-pointer`}
                      title={`${cell.day} ${cell.hour}:00 - Intensity: ${cell.weight} msg`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legends */}
        <div className="flex gap-4 items-center justify-end text-[9px] text-gray-500 font-mono pt-2">
          <span>Low Volume</span>
          <div className="w-3 h-3 bg-purple-950/20 border border-white/5 rounded" />
          <div className="w-3 h-3 bg-purple-700/50 border border-white/5 rounded" />
          <div className="w-3 h-3 bg-purple-600/80 border border-white/5 rounded" />
          <div className="w-3 h-3 bg-purple-500 border border-white/5 rounded" />
          <span>High Volume</span>
        </div>
      </div>

      {/* Channel Share distribution */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Channel Performance Shares</h3>

        <div className="space-y-3.5">
          {channelData.map((channel) => (
            <div key={channel.name} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white font-semibold">{channel.name}</span>
                <span className="text-gray-400">{channel.share}% share</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${channel.share}%` }}
                  transition={{ ease: easeCurve, duration: 1 }}
                  className={`h-full ${channel.color}`}
                />
              </div>
            </div>
          ))}
        </div>
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

function ModerationView() {
  const [toxicUsers, setToxicUsers] = useState<FlaggedUser[]>([
    { id: "1", name: "SpammyMcSpam", platform: "Discord", reason: "Repetition limit exceeded (67 messages in #support)", severity: "High", status: "Flagged" },
    { id: "2", name: "Alice45", platform: "Telegram", reason: "Hostile language matched toxic keywords threshold", severity: "Medium", status: "Flagged" },
    { id: "3", name: "InjectedUser", platform: "Slack", reason: "Detected ChatGPT instruction overrides (injection)", severity: "High", status: "Flagged" },
    { id: "4", name: "BotTester", platform: "WhatsApp", reason: "Repeated API abuse queries", severity: "Low", status: "Flagged" }
  ]);

  const [activeCategory, setActiveCategory] = useState<"Toxic" | "Spammer" | "Injection">("Toxic");

  const handleAction = (id: string, action: "Blocked" | "Dismissed") => {
    setToxicUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, status: action } : user))
    );
  };

  const getStats = (cat: string) => {
    if (cat === "Toxic") return toxicUsers.filter((u) => u.severity === "Medium" && u.status === "Flagged").length;
    if (cat === "Spammer") return toxicUsers.filter((u) => u.name.toLowerCase().includes("spam") && u.status === "Flagged").length;
    return toxicUsers.filter((u) => u.reason.toLowerCase().includes("inject") && u.status === "Flagged").length;
  };

  return (
    <div className="space-y-6">
      
      {/* Moderation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key: "Toxic" as const, title: "Toxic Users", value: "15 Flagged", iconColor: "text-red-400 bg-red-500/10" },
          { key: "Spammer" as const, title: "Spammers", value: "8 Flagged", iconColor: "text-amber-400 bg-amber-500/10" },
          { key: "Injection" as const, title: "Injection Attempts", value: "4 Blocked", iconColor: "text-purple-400 bg-purple-500/10" }
        ].map((item) => {
          const isActive = activeCategory === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveCategory(item.key)}
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                isActive 
                  ? "bg-white/5 border-purple-500/30 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]" 
                  : "bg-white/2 border-white/2 hover:border-white/5 text-gray-400"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${item.iconColor}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{item.title}</span>
                <div className="text-xl font-bold text-white mt-1 font-mono">{item.value}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Flagged user detailed drill-down table */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            Reviewing Category: {activeCategory}
          </h4>
          <span className="text-[10px] text-gray-500 font-mono">Actions feed real-time firewalls</span>
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
              {toxicUsers.filter(u => u.status === "Flagged").length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    All clear. No pending reviews for {activeCategory} violations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// 7. SETTINGS VIEW
function SettingsView() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 font-mono">System Configuration</span>
        <h2 className="text-2xl font-bold text-white mt-1">General Settings</h2>
        <p className="text-xs text-gray-400 mt-1">Manage AI behaviors, deployment scopes, and database indexing.</p>
      </div>

      <div className="space-y-4">
        {/* Index updates */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Agent Response Thresholds</h3>
          
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Confidence Auto-Answer Cutoff</span>
              <span className="text-white font-mono font-bold">85% Confidence</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-[85%] bg-purple-600" />
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              Queries resolved below this confidence level route directly to human validation queues.
            </p>
          </div>
        </div>

        {/* Sync trigger */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">Trigger Manual DB Sync</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">Re-index all channel vector embeddings.</p>
          </div>
          <button className="px-3 py-1.5 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-md">
            Sync Vectors
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom simple spinner
function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={`animate-spin h-5 w-5 text-purple-500 ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
