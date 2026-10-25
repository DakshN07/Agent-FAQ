"use client";

import { useEffect, useRef, useState } from "react";
import { Check, AlertCircle, RefreshCw, Unplug, ArrowRight } from "lucide-react";
import { api, type IntegrationState } from "@/lib/api";

/**
 * A channel connect button.
 *
 * The user-visible flow is: click → the provider's own account/permission
 * screen → back here → the button animates to "Connected". Each state is
 * explicit so the button can never look "done" while the connection is
 * actually broken.
 *
 * `onConnect` is delegated to the parent because the first step differs by
 * platform: Discord and Slack need a full-page redirect to the provider, while
 * Telegram opens a dialog (Telegram has no bot OAuth, so it needs a token
 * pasted from @BotFather).
 */

type Props = {
  platform: "discord" | "slack" | "telegram";
  eventId: string | null;
  state: IntegrationState | undefined;
  /** Reason code from the OAuth return redirect (?connected=none&reason=...) */
  redirectReason?: string | null;
  /** Begin connecting. The parent decides how (redirect vs. dialog). */
  onConnect: () => void;
  /** Re-fetch status from the backend. */
  onRefresh: () => void;
};

const REASONS: Record<string, string> = {
  declined: "You cancelled the authorization.",
  invalid_state: "That connection link expired or was already used. Please try again.",
  exchange_failed: "We couldn't finish the connection. Please try again.",
  provider_error: "The provider reported an error. Please try again.",
  forbidden: "You no longer have permission to manage this event.",
  needs_bot_token: "Paste your bot token to finish connecting Telegram.",
  unsupported: "This platform isn't supported yet.",
};

export default function ConnectButton({
  platform,
  eventId,
  state,
  redirectReason,
  onConnect,
  onRefresh,
}: Props) {
  const connected = Boolean(state?.connected);
  const running = Boolean(state?.running);
  // Credentials saved but the adapter isn't actually online — worth showing as
  // a warning rather than a clean success.
  const degraded = connected && !running;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState(false);
  const prevConnected = useRef(connected);

  // Surface a provider-side failure immediately on return from the redirect.
  useEffect(() => {
    if (redirectReason && REASONS[redirectReason]) {
      setError(REASONS[redirectReason]);
    }
  }, [redirectReason]);

  // Fire the "connected" animation once, when the state flips true.
  useEffect(() => {
    if (connected && !prevConnected.current) {
      setJustConnected(true);
      const t = setTimeout(() => setJustConnected(false), 1600);
      return () => clearTimeout(t);
    }
    prevConnected.current = connected;
  }, [connected]);

  const handleReconnect = async () => {
    if (!eventId) return;
    setError(null);
    setBusy(true);
    try {
      await api.reconnectIntegration(eventId, platform);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || "Reconnect failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!eventId) return;
    setError(null);
    setBusy(true);
    try {
      await api.disconnectIntegration(eventId, platform);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || "Could not disconnect.");
    } finally {
      setBusy(false);
    }
  };

  // ---- Connected ---------------------------------------------------------
  if (connected) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
              justConnected
                ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-300 scale-105 shadow-lg shadow-emerald-500/20"
                : degraded
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <Check className={`w-4 h-4 ${justConnected ? "animate-in zoom-in duration-500" : ""}`} />
            {justConnected ? "Connected!" : degraded ? "Saved — not running" : "Connected"}
          </div>

          <button
            onClick={handleReconnect}
            disabled={busy}
            title={degraded ? "Retry connecting" : "Reconnect"}
            aria-label="Reconnect"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleDisconnect}
            disabled={busy}
            title="Disconnect"
            aria-label="Disconnect"
            className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Unplug className="w-4 h-4" />
          </button>
        </div>

        {/* Why it isn't running — otherwise a dead bot just looks idle. */}
        {(state?.runtimeError || state?.lastError) && (
          <span className="flex items-center gap-1 text-[11px] text-amber-400/90 max-w-[280px] text-right">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {state?.runtimeError || state?.lastError}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1 text-xs text-red-400 max-w-[280px] text-right">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </span>
        )}
      </div>
    );
  }

  // ---- Disconnected ------------------------------------------------------
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={onConnect}
        disabled={busy || !eventId}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Connect
        <ArrowRight className="w-4 h-4" />
      </button>

      {error && (
        <span className="flex items-center gap-1 text-xs text-red-400 max-w-[280px] text-right">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
}
