"use client";

import { useState } from "react";
import { X, ExternalLink, Loader2, Check, AlertCircle, Copy } from "lucide-react";
import { api } from "@/lib/api";

/**
 * Telegram connection dialog.
 *
 * Unlike Discord and Slack, Telegram has no bot OAuth — a bot is created by
 * chatting with @BotFather and is identified by a token, not a redirect
 * consent screen. So this is the one channel that needs a field instead of a
 * redirect, and the flow is built to be as short as possible:
 *
 *   1. "Open BotFather" link (or the token is already copied)
 *   2. Paste token -> we verify it live against Telegram's getMe
 *   3. Saved and connected
 *
 * Verifying before saving is the important part: a mistyped token would
 * otherwise be stored and produce a silently dead bot.
 */

type Props = {
  eventId: string;
  onClose: () => void;
  onConnected: () => void;
};

export default function TelegramConnectDialog({ eventId, onClose, onConnected }: Props) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botName, setBotName] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setBotName(null);
    setChecking(true);
    try {
      const res = await api.verifyTelegramToken(token.trim());
      if (res.valid) {
        setBotName(res.botUsername ? `@${res.botUsername}` : null);
      } else {
        setError(res.error || "Telegram did not accept that token.");
      }
    } catch (err: any) {
      setError(err?.message || "Could not reach Telegram. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.connectTelegramBot(eventId, token.trim());
      onConnected();
    } catch (err: any) {
      setError(err?.message || "Could not connect that bot.");
      setBusy(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setToken(text.trim());
    } catch {
      setError("Could not read the clipboard — paste the token manually.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="telegram-connect-title"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="telegram-connect-title" className="text-lg font-semibold">
              Connect Telegram
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Telegram connects with a bot token rather than a permissions screen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-semibold shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p>
                Open{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  @BotFather <ExternalLink className="w-3 h-3" />
                </a>{" "}
                in Telegram
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send <code className="px-1 py-0.5 rounded bg-accent">/newbot</code>, give it a name and a username.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-semibold shrink-0 mt-0.5">
              2
            </span>
            <div className="flex-1">
              <p>
                Copy the token BotFather gives you{" "}
                <button
                  onClick={handlePasteFromClipboard}
                  className="text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  type="button"
                >
                  <Copy className="w-3 h-3" /> paste
                </button>
              </p>
              <input
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setBotName(null);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && token.trim() && botName) handleConnect();
                }}
                placeholder="123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxx"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-semibold shrink-0 mt-0.5">
              3
            </span>
            <p>Connect. We verify the token with Telegram before saving it.</p>
          </li>
        </ol>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        {botName && (
          <div className="mt-4 flex items-center gap-2 p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>
              Valid bot: <span className="font-semibold">{botName}</span>
            </span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {botName ? (
            <button
              onClick={handleConnect}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Connect bot
            </button>
          ) : (
            <button
              onClick={handleVerify}
              disabled={!token.trim() || checking}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {checking && <Loader2 className="w-4 h-4 animate-spin" />}
              Check token
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
