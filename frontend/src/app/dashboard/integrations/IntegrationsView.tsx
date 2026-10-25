"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  MessageCircle,
  Code2,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
} from "lucide-react";
import { api, getStoredActiveEventId, type IntegrationState } from "@/lib/api";
import ConnectButton from "@/components/ConnectButton";
import TelegramConnectDialog from "@/components/TelegramConnectDialog";
import ImportFaqsDialog from "@/components/ImportFaqsDialog";

// Backend base URL — must match the deployed API (set NEXT_PUBLIC_API_URL in the
// frontend deployment). The widget script snippet has to point at the API origin.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** Platforms whose message history we can actually read (see services/faqImport.js). */
const IMPORTABLE = new Set(["discord", "slack"]);

const CHANNEL_PLATFORMS = [
  {
    name: "Discord",
    platform: "discord" as const,
    description: "Answer questions in your Discord server.",
    setupHint: "You'll pick the server and approve the permissions Discord shows you.",
    icon: MessageCircle,
    color: "text-indigo-400 bg-indigo-400/10",
  },
  {
    name: "Slack",
    platform: "slack" as const,
    description: "Answer questions in your Slack workspace.",
    setupHint: "You'll pick the workspace and approve the scopes Slack shows you.",
    icon: MessageSquare,
    color: "text-blue-400 bg-blue-400/10",
  },
  {
    name: "Telegram",
    platform: "telegram" as const,
    description: "Answer questions from your Telegram bot.",
    setupHint: "Telegram connects with a bot token from @BotFather.",
    icon: MessageCircle,
    color: "text-sky-400 bg-sky-400/10",
  },
];

type Props = {
  /** `?connected=<platform>` from the OAuth return redirect, or "none". */
  connectedParam: string | null;
  /** `?reason=<code>` when the connection did not succeed. */
  reasonParam: string | null;
  /** `?platform=<platform>` — which platform the attempt was for. */
  platformParam: string | null;
};

export default function IntegrationsView({ connectedParam, reasonParam, platformParam }: Props) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, IntegrationState> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState<string | null>(null);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [importingFrom, setImportingFrom] = useState<"discord" | "slack" | null>(null);
  const [copied, setCopied] = useState(false);

  // The active event is chosen client-side (stored in localStorage), so the
  // status fetch has to wait for it.
  useEffect(() => {
    setEventId(getStoredActiveEventId());
  }, []);

  const refresh = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    try {
      setStatus(await api.getIntegrationStatus(eventId));
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Could not load your connections. Make sure you have an event selected.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  /** A banner describing the outcome of the last OAuth round-trip. */
  const banner = useMemo(() => {
    if (!connectedParam) return null;
    if (connectedParam === "none") {
      return {
        tone: "error" as const,
        text: reasonParam === "declined" ? "You cancelled the connection." : "The connection didn't complete.",
      };
    }
    if (!CHANNEL_PLATFORMS.some((p) => p.platform === connectedParam)) return null;
    const name = CHANNEL_PLATFORMS.find((p) => p.platform === connectedParam)!.name;
    return { tone: "success" as const, text: `${name} is connected.` };
  }, [connectedParam, reasonParam]);

  /**
   * Pass the failure reason only to the card it belongs to. Without the
   * `platform` query param we can't tell which one, so the banner carries the
   * message on its own rather than stamping it on every card.
   */
  const reasonFor = (platform: string) =>
    connectedParam === "none" && reasonParam && platformParam === platform ? reasonParam : null;

  const handleConnect = async (platform: "discord" | "slack" | "telegram") => {
    if (!eventId) {
      setError("Select or create an event before connecting a channel.");
      return;
    }
    if (platform === "telegram") {
      setTelegramOpen(true);
      return;
    }
    setError(null);
    setRedirecting(platform);
    try {
      const { authorizeUrl } = await api.beginOAuthConnect(platform, eventId);
      // Full navigation: the provider consent screen is a different origin.
      // assign() rather than assigning .href, which React's lint rules treat as
      // mutating a global.
      window.location.assign(authorizeUrl);
    } catch (err: any) {
      setError(err?.message || "Could not start the connection.");
      setRedirecting(null);
    }
  };

  const widgetSnippet = eventId
    ? `<script src="${API_BASE_URL}/api/widget/script.js" data-event-id="${eventId}"></script>`
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect a channel and your FAQs start answering questions there.
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          {eventId ? `Active event: ${eventId}` : "No event selected — pick one to connect channels."}
        </p>
      </div>

      {banner && (
        <div
          className={`flex items-center gap-2 p-3 text-sm border rounded-lg ${
            banner.tone === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {banner.tone === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {banner.text}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {!eventId && !loading && (
        <div className="p-4 text-sm bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
          Create or select an event first — channels are always attached to one event.
        </div>
      )}

      <div className="grid gap-4">
        {CHANNEL_PLATFORMS.map((app) => (
          <div
            key={app.platform}
            className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors"
          >
            <div className="flex items-center gap-5 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${app.color}`}>
                <app.icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg">{app.name}</h3>
                <p className="text-sm text-muted-foreground">{app.description}</p>
                {/* Show what the connection actually involves, so the click
                    isn't a mystery redirect. */}
                <p className="text-xs text-muted-foreground/70 mt-1">{app.setupHint}</p>
                {status?.[app.platform]?.label && (
                  <p className="text-xs text-muted-foreground/70 mt-1 font-mono truncate">
                    {status[app.platform].label}
                  </p>
                )}
              </div>
            </div>

            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="relative">
                {/* Overlay spinner while the full-page redirect is in flight. */}
                {redirecting === app.platform && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                {/* Once connected, offer to pull in answers they've already
                    written down in that channel. */}
                {status?.[app.platform]?.connected && IMPORTABLE.has(app.platform) && (
                  <button
                    onClick={() => setImportingFrom(app.platform as "discord" | "slack")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    title={`Import existing questions from ${app.name}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Import FAQs
                  </button>
                )}
                <ConnectButton
                  platform={app.platform}
                  eventId={eventId}
                  state={status?.[app.platform]}
                  redirectReason={reasonFor(app.platform)}
                  onConnect={() => handleConnect(app.platform)}
                  onRefresh={refresh}
                />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Web widget — no OAuth, just a script tag. */}
      <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-emerald-400 bg-emerald-400/10">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Web Widget</h3>
            <p className="text-sm text-muted-foreground">
              Embed a chat widget on your event website. No connection needed.
            </p>
          </div>
        </div>

        {widgetSnippet ? (
          <div className="flex items-start gap-2">
            <code className="flex-1 p-3 rounded-lg bg-accent/50 border border-border text-xs font-mono overflow-x-auto whitespace-nowrap">
              {widgetSnippet}
            </code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(widgetSnippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Select an event to get your snippet.</p>
        )}

        <p className="text-xs text-muted-foreground">
          Paste it inside the <code className="px-1 py-0.5 rounded bg-accent">&lt;body&gt;</code> of your
          website.{" "}
          <a
            href="https://console.discord.com/developers/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 hover:underline"
          >
            Discord apps <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      {telegramOpen && eventId && (
        <TelegramConnectDialog
          eventId={eventId}
          onClose={() => setTelegramOpen(false)}
          onConnected={() => {
            setTelegramOpen(false);
            refresh();
          }}
        />
      )}

      {importingFrom && eventId && (
        <ImportFaqsDialog
          eventId={eventId}
          platform={importingFrom}
          platformName={importingFrom === "discord" ? "Discord" : "Slack"}
          onClose={() => setImportingFrom(null)}
          onImported={refresh}
        />
      )}
    </div>
  );
}
