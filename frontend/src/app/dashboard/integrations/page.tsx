"use client";

import { useEffect, useState } from "react";
import { MessageSquare, MessageCircle, Code2, Check, ArrowRight } from "lucide-react";
import { API_BASE_URL, apiFetch, ensureCurrentEventId } from "@/lib/api";

const INTEGRATIONS = [
  {
    name: "Slack",
    description: "Connect your workspace to answer queries directly in channels.",
    icon: MessageSquare,
    color: "text-blue-400 bg-blue-400/10",
    status: "connected"
  },
  {
    name: "Discord",
    description: "Deploy the bot to your community server and manage roles.",
    icon: MessageCircle,
    color: "text-indigo-400 bg-indigo-400/10",
    status: "available"
  },
  {
    name: "Web Widget",
    description: "Embed a beautiful chat widget directly on your event website.",
    icon: Code2,
    color: "text-emerald-400 bg-emerald-400/10",
    status: "available",
    action: "widget"
  },
  {
    name: "Telegram",
    description: "Connect your Telegram Bot to answer users on mobile.",
    icon: MessageCircle,
    color: "text-sky-400 bg-sky-400/10",
    status: "available",
    action: "oauth"
  },
  {
    name: "WhatsApp",
    description: "Deploy the agent to a WhatsApp Business account.",
    icon: MessageSquare,
    color: "text-green-500 bg-green-500/10",
    status: "available",
    action: "oauth"
  }
];

export default function IntegrationsPage() {
  const [eventId, setEventId] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadIntegrations = async () => {
      const currentEventId = await ensureCurrentEventId();
      setEventId(currentEventId);
      if (!currentEventId) return;

      const integrations = await apiFetch<Array<{ platform: string; isActive: boolean }>>(`/events/${currentEventId}/integrations`);
      setConnectedPlatforms(new Set(integrations.filter((integration) => integration.isActive).map((integration) => integration.platform)));
    };

    loadIntegrations().catch((error) => console.error("Failed to load integrations", error));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect your favorite platforms with 1-click.</p>
      </div>

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
            
            {connectedPlatforms.has(app.name.toLowerCase()) ? (
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-medium border border-emerald-500/20">
                <Check className="w-4 h-4" />
                Connected
              </button>
            ) : (
              <button 
                onClick={() => {
                    if (!eventId) {
                        alert("Create or select an event before connecting integrations.");
                        return;
                    }
                    if (app.action === 'widget') {
                        alert(`<!-- Add this to your website's <head> -->
<script src="${API_BASE_URL.replace(/\/api$/, "")}/widget.js" data-event-id="${eventId}"></script>`);
                    } else {
                        window.location.href = `${API_BASE_URL}/oauth/${app.name.toLowerCase()}?state=${eventId}`;
                    }
                }}
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
