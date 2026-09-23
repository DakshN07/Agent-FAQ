"use client";

import { useEffect, useState } from "react";
import { MessageSquare, MessageCircle, Code2, Check, ArrowRight, Loader2 } from "lucide-react";
import { api, getStoredActiveEventId, EVENT_KEY } from "@/lib/api";

// Backend base URL — must match the deployed API (set NEXT_PUBLIC_API_URL in the frontend deployment).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const INTEGRATIONS = [
  {
    name: "Slack",
    platform: "slack",
    description: "Connect your workspace to answer queries directly in channels.",
    icon: MessageSquare,
    color: "text-blue-400 bg-blue-400/10",
  },
  {
    name: "Discord",
    platform: "discord",
    description: "Deploy the bot to your community server and manage roles.",
    icon: MessageCircle,
    color: "text-indigo-400 bg-indigo-400/10",
  },
  {
    name: "Web Widget",
    platform: "web",
    description: "Embed a beautiful chat widget directly on your event website.",
    icon: Code2,
    color: "text-emerald-400 bg-emerald-400/10",
    action: "widget",
  },
  {
    name: "Telegram",
    platform: "telegram",
    description: "Connect your Telegram Bot to answer users on mobile.",
    icon: MessageCircle,
    color: "text-sky-400 bg-sky-400/10",
    action: "oauth",
  },
];

export default function IntegrationsPage() {
  const [eventId, setEventId] = useState<string | null>(null);
  const [activePlatforms, setActivePlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredActiveEventId();
    if (stored) {
      setEventId(stored);
    } else if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(EVENT_KEY);
      if (raw) setEventId(raw);
    }
  }, []);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .getIntegrations(eventId)
      .then((integrations) => {
        if (cancelled) return;
        if (Array.isArray(integrations)) {
          const active = integrations.filter((i) => i && i.isActive).map((i) => String(i.platform || "").toLowerCase());
          setActivePlatforms(active);
        }
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || "Could not load integrations. Make sure you have an event selected.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const isConnected = (platform: string) => activePlatforms.includes(platform);

  const handleConnect = (app: (typeof INTEGRATIONS)[number]) => {
    if (!eventId) {
      setError("Select or create an event before connecting channels.");
      return;
    }
    if (app.action === "widget") {
      const script = `<script src="${API_BASE_URL}/widget.js" data-event-id="${eventId}"></script>`;
      alert(`Add this to your website's <head>:\n\n${script}`);
    } else {
      window.location.href = `${API_BASE_URL}/api/oauth/${app.platform}?state=${eventId}`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect your favorite platforms with 1-click.</p>
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          {eventId ? `Active event: ${eventId}` : "No event selected — connect channels to a specific event."}
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">{error}</div>
      )}

      <div className="grid gap-4">
        {INTEGRATIONS.map((app) => (
          <div key={app.name} className="flex items-center justify-between p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.color}`}>
                <app.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{app.name}</h3>
                <p className="text-sm text-muted-foreground">{app.description}</p>
              </div>
            </div>

            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : isConnected(app.platform) ? (
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-medium border border-emerald-500/20">
                <Check className="w-4 h-4" />
                Connected
              </button>
            ) : (
              <button
                onClick={() => handleConnect(app)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-colors"
              >
                Connect
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}