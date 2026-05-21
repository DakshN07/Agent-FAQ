"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  Send,
  MoreVertical,
  ThumbsUp,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InboxPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [draftText, setDraftText] = useState("");
  const eventId = "PLACEHOLDER_EVENT_ID"; // In real app, get from Context

  useEffect(() => {
    fetch(`http://localhost:3000/api/unknown-questions?eventId=${eventId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            const formatted = data.map(q => ({
                id: q._id,
                user: "User",
                platform: q.sourcePlatform,
                query: q.text,
                status: q.handoffStatus,
                time: new Date(q.lastAskedAt || q.firstAskedAt).toLocaleTimeString(),
                aiDraft: "I'm sorry, I don't have an answer for that yet. Can I help you with anything else?",
                confidence: 0
            }));
            setQueries(formatted);
            if (formatted.length > 0) {
                setSelectedQuery(formatted[0]);
                setDraftText(formatted[0].aiDraft);
            }
        }
      })
      .catch(console.error);
  }, [eventId]);

  const handleApprove = async () => {
    if (!selectedQuery) return;
    try {
        await fetch(`http://localhost:3000/api/unknown-questions/${selectedQuery.id}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: draftText })
        });
        setQueries(q => q.filter(item => item.id !== selectedQuery.id));
        setSelectedQuery(null);
        setDraftText("");
        alert("Answer sent and saved to FAQ!");
    } catch (e) {
        alert("Failed to send answer");
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      
      {/* Column 1: Queue */}
      <div className="w-1/3 flex flex-col gap-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-card/80">
          <h2 className="font-semibold flex items-center justify-between">
            Pending Approvals
            <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
              {queries.length}
            </span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {queries.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setSelectedQuery(q);
                setDraftText(q.aiDraft);
              }}
              className={cn(
                "w-full text-left p-4 rounded-lg transition-all duration-200 border",
                selectedQuery.id === q.id 
                  ? "bg-accent/20 border-accent text-accent-foreground" 
                  : "bg-background border-transparent hover:border-border"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm">{q.user}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {q.time}
                </span>
              </div>
              <p className="text-sm line-clamp-2 text-muted-foreground mb-3">{q.query}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
                  via {q.platform}
                </span>
                <span className={cn(
                  "flex items-center gap-1",
                  q.confidence > 90 ? "text-emerald-500" : "text-amber-500"
                )}>
                  {q.confidence > 90 ? <ThumbsUp className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {q.confidence}% Match
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Column 2: Context */}
      <div className="w-1/3 flex flex-col gap-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-card/80 flex justify-between items-center">
          <h2 className="font-semibold">User Context</h2>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {selectedQuery.user.charAt(0)}
            </div>
            <div>
              <h3 className="font-medium">{selectedQuery.user}</h3>
              <p className="text-sm text-muted-foreground">User on {selectedQuery.platform}</p>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Incoming Message
            </div>
            <p className="text-sm font-medium leading-relaxed">
              "{selectedQuery.query}"
            </p>
          </div>
        </div>
      </div>

      {/* Column 3: AI Draft & Approval */}
      <div className="w-1/3 flex flex-col rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="p-4 border-b border-border bg-card/80">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            AI Response Draft
          </h2>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Edit Draft</label>
            <textarea 
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full h-full min-h-[200px] bg-background border border-border rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-border mt-auto">
            <button className="flex-1 bg-background border border-border hover:bg-muted text-foreground py-2.5 rounded-lg text-sm font-medium transition-colors">
              Reject
            </button>
            <button onClick={handleApprove} className="flex-1 bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg">
              <CheckCircle2 className="w-4 h-4" />
              Approve & Send
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// Sparkles Icon component wrapper if not imported from lucide-react above
function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
