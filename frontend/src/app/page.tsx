'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string, citations?: string[], intent?: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({ hallucination_score: 0, retrieval_accuracy: 0, average_latency: 0, token_usage_total: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch metrics
    fetch('http://localhost:8000/api/metrics/')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error("Metrics fetch error", err));
  }, [messages]); // Refresh metrics occasionally

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!query.trim()) return;
    
    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || "No response generated.",
        citations: data.citations,
        intent: data.intent
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to the Knowledge Assistant.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setUploadStatus('Uploading...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('http://localhost:8000/api/rag/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploadStatus('Success: ' + (data.message || 'File uploaded'));
      setFile(null);
    } catch (err) {
      console.error(err);
      setUploadStatus('Upload failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans selection:bg-blue-500/30">
      {/* Background gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 h-[calc(100vh-2rem)]">
        
        {/* Left Sidebar: Dashboard & Upload */}
        <div className="lg:col-span-3 flex flex-col gap-6 h-full">
          {/* Metrics Panel */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">System Metrics</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-gray-400">Accuracy</p>
                <p className="text-xl font-mono text-green-400">{(metrics.retrieval_accuracy * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-gray-400">Hallucination</p>
                <p className="text-xl font-mono text-blue-400">{(metrics.hallucination_score * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-gray-400">Latency</p>
                <p className="text-xl font-mono text-yellow-400">{metrics.average_latency.toFixed(2)}s</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-gray-400">Tokens</p>
                <p className="text-xl font-mono text-purple-400">{(metrics.token_usage_total / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </div>

          {/* Upload Panel */}
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">Knowledge Base</h2>
            <p className="text-sm text-gray-400 mb-4">Upload documents (PDF, MD, TXT) to expand the assistant's context.</p>
            
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center flex-1 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.txt,.md"
              />
              <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                <svg className="w-10 h-10 text-gray-500 group-hover:text-blue-400 transition-colors mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <span className="text-sm font-medium text-gray-300">{file ? file.name : "Select a file"}</span>
              </label>
            </div>
            
            <button 
              onClick={handleFileUpload}
              disabled={!file}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              Process & Embed
            </button>
            {uploadStatus && <p className="text-xs text-center mt-3 text-gray-400">{uploadStatus}</p>}
          </div>
        </div>

        {/* Right Area: Chat Interface */}
        <div className="lg:col-span-9 glass-panel rounded-2xl flex flex-col overflow-hidden h-full">
          <div className="p-5 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
              <h1 className="text-lg font-semibold tracking-wide">Multi-Agent Assistant</h1>
            </div>
            <div className="text-xs font-mono text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              LangGraph Orchestrated
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                <p className="text-lg font-medium">How can I help you today?</p>
                <p className="text-sm">Ask questions, create tickets, or query the knowledge base.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                  {msg.role === 'assistant' && msg.intent && (
                    <div className="flex gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-500/30">
                        {msg.intent}
                      </span>
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-[0_4px_20px_rgba(37,99,235,0.3)]' : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500">Sources:</span>
                      {msg.citations.map((cite, i) => (
                        <span key={i} className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          {cite}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="self-start flex gap-2 p-4 rounded-2xl bg-white/5 rounded-bl-none border border-white/5">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-5 border-t border-white/10 bg-black/40">
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask the Multi-Agent Assistant..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-14 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!query.trim() || loading}
                className="absolute right-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
