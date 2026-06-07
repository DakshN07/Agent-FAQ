"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, User as UserIcon, Bot, BarChart3, Users, MessageSquare } from "lucide-react";

export default function AIAdminAssistant() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: 'Hello! I am your Analytics Agent. You can ask me anything about your platform\'s support activity, resolution rates, or frequently asked questions.' }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: 'I am analyzing the recent database snapshots to answer your query. Based on the last 30 days, most users are asking about billing integrations.' 
      }]);
    }, 1000);
  };

  const suggestions = [
    { icon: <BarChart3 className="w-4 h-4" />, text: "Show resolution rate this week" },
    { icon: <MessageSquare className="w-4 h-4" />, text: "What are the top 3 unanswered questions?" },
    { icon: <Users className="w-4 h-4" />, text: "Summarize toxic behavior from Telegram" }
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-xl shadow-purple-500/20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Platform AI Assistant</h1>
        <p className="text-sm text-muted-foreground">Ask anything about your customer support data.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 smooth-scroll space-y-6">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i === messages.length - 1 && msg.role === 'ai' ? 0.2 : 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-card border border-border/50 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Suggestions - only show if few messages */}
        {messages.length < 3 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 pt-8"
          >
            {suggestions.map((s, i) => (
              <button 
                key={i}
                onClick={() => setInput(s.text)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 hover:bg-muted text-sm transition-all shadow-sm"
              >
                {s.icon}
                {s.text}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background via-background to-transparent pt-12">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex items-center bg-card border border-border/50 rounded-full shadow-lg">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask the Analytics Agent..." 
              className="flex-1 bg-transparent px-6 py-4 text-sm focus:outline-none placeholder:text-muted-foreground/70"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="mr-2 p-2.5 bg-foreground text-background rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
