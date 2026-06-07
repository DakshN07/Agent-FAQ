"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Clock, Send, MoreVertical, ShieldAlert,
  Bot, User as UserIcon, CheckCircle2, Search, Filter
} from "lucide-react";

export default function UnifiedInbox() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState("All");

  const eventId = "PLACEHOLDER_EVENT_ID"; // Get from context

  useEffect(() => {
    // Mock data for UI demonstration since backend DB might be empty initially
    const mockConvs = [
      { _id: '1', platform: 'discord', status: 'Escalated', lastMessageAt: new Date().toISOString(), userId: { username: 'AlexD' }, text: 'I am getting a billing error.' },
      { _id: '2', platform: 'telegram', status: 'Answered', lastMessageAt: new Date(Date.now() - 3600000).toISOString(), userId: { username: 'CryptoFan' }, text: 'When is the next drop?' },
      { _id: '3', platform: 'slack', status: 'Pending', lastMessageAt: new Date(Date.now() - 7200000).toISOString(), userId: { username: 'Sarah Team' }, text: 'How do I invite members?' },
    ];
    setConversations(mockConvs);
  }, []);

  const handleSelectConv = (conv: any) => {
    setSelectedConv(conv);
    // Mock messages
    setMessages([
      { id: 'm1', senderType: 'User', text: conv.text, createdAt: conv.lastMessageAt },
      ...(conv.status === 'Answered' ? [{ id: 'm2', senderType: 'Agent', text: 'The next drop is on Friday at 5 PM UTC!', createdAt: new Date().toISOString(), confidence: 0.95 }] : [])
    ]);
  };

  const filteredConvs = filter === "All" ? conversations : conversations.filter(c => c.status === filter);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 bg-background text-foreground font-sans">
      
      {/* Sidebar: Conversation List */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-1/3 lg:w-1/4 flex flex-col rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl overflow-hidden shadow-sm"
      >
        <div className="p-4 border-b border-border/50">
          <h2 className="text-lg font-medium tracking-tight mb-4">Inbox</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {["All", "Pending", "Escalated", "Answered"].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`snap-start px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${filter === f ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 smooth-scroll">
          <AnimatePresence>
            {filteredConvs.map((conv, i) => (
              <motion.button
                key={conv._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelectConv(conv)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${selectedConv?._id === conv._id ? 'bg-accent text-accent-foreground ring-1 ring-border/50 shadow-sm' : 'hover:bg-muted/30'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm truncate pr-2">{conv.userId?.username || 'Anonymous'}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{conv.platform}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">{conv.text}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${conv.status === 'Answered' ? 'bg-emerald-500/10 text-emerald-500' : conv.status === 'Escalated' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {conv.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content: Chat View */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl overflow-hidden shadow-sm relative"
      >
        {selectedConv ? (
          <>
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-inner">
                  {(selectedConv.userId?.username || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium tracking-tight text-sm">{selectedConv.userId?.username || 'Anonymous'}</h3>
                  <p className="text-xs text-muted-foreground">via {selectedConv.platform}</p>
                </div>
              </div>
              <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 smooth-scroll">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.senderType === 'User' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] flex flex-col ${msg.senderType === 'User' ? 'items-start' : 'items-end'}`}>
                      <div className={`flex items-center gap-2 mb-1 px-1 ${msg.senderType === 'User' ? 'flex-row' : 'flex-row-reverse'}`}>
                        {msg.senderType === 'Agent' ? <Bot className="w-3 h-3 text-purple-500" /> : <UserIcon className="w-3 h-3 text-muted-foreground" />}
                        <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                          {msg.senderType}
                        </span>
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.senderType === 'User' ? 'bg-muted/50 rounded-tl-sm' : 'bg-primary text-primary-foreground shadow-md rounded-tr-sm'}`}>
                        {msg.text}
                      </div>
                      {msg.confidence && (
                        <div className="mt-1 px-1 text-[10px] text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {(msg.confidence * 100).toFixed(0)}% AI Confidence
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-4 bg-card/50 border-t border-border/50">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type a reply to send..." 
                  className="w-full bg-background border border-border/50 rounded-full pl-6 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                />
                <button className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-full hover:scale-105 transition-transform shadow-md">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest">
                Replying will train the AI automatically
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <MessageSquare className="w-16 h-16 mb-4 stroke-[1.5]" />
            <p className="text-sm font-medium tracking-wide">Select a conversation to begin</p>
          </div>
        )}
      </motion.div>

    </div>
  );
}
