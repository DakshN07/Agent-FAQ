"use client";

import { useState, useEffect } from "react";
import { KeyRound, ExternalLink, Check, Loader2, AlertCircle, ShieldCheck, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

/**
 * Bring-your-own-Mistral-key step.
 *
 * Agent-FAQ's AI features (semantic FAQ matching, the moderation/supervisor/
 * analytics agents) all run on Mistral. Instead of requiring one deployment-wide
 * secret, each user pastes their own key here.
 *
 * The backend verifies the key against Mistral before saving it and stores it
 * encrypted, so this component never handles storage — only submission.
 */

const MISTRAL_KEYS_URL = "https://console.mistral.ai/api-keys";

export type MistralKeyStatus = {
  configured: boolean;
  source: "user" | "env" | "none";
  verifiedAt: string | null;
};

type Props = {
  /** Called when the step is finished and the user chooses to continue. */
  onDone?: () => void;
  /** Show a "Skip for now" affordance (used mid-onboarding). */
  skippable?: boolean;
};

export function MistralKeyStep({ onDone, skippable = true }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<MistralKeyStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // On mount, ask the backend whether a key already exists.
  useEffect(() => {
    let cancelled = false;
    api
      .getMistralKeyStatus()
      .then((s) => {
        if (cancelled) return;
        setStatus(s);
        if (s.configured) setSaved(true);
      })
      .catch(() => {
        // A failed status check isn't fatal — the user can still add a key.
        if (cancelled) return;
        setStatus({ configured: false, source: "none", verifiedAt: null });
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError("Paste your Mistral API key first.");
      return;
    }

    setSaving(true);
    try {
      await api.saveMistralKey(trimmed);
      setStatus({ configured: true, source: "user", verifiedAt: new Date().toISOString() });
      setSaved(true);
      setApiKey("");
      setReveal(false);
    } catch (err: any) {
      setError(err?.message || "Could not save that key. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setSaving(true);
    try {
      await api.removeMistralKey();
      setStatus((prev) => ({ ...(prev as MistralKeyStatus), configured: false, source: "none", verifiedAt: null }));
      setSaved(false);
    } catch (err: any) {
      setError(err?.message || "Could not remove that key.");
    } finally {
      setSaving(false);
    }
  };

  // Server-provided key (shared deployment key) — nothing for the user to do.
  if (!checking && status?.source === "env" && status.configured) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-300">AI is already enabled</p>
            <p className="text-xs text-emerald-400/80 mt-1">
              This deployment provides a shared Mistral key, so you can skip this step.
            </p>
          </div>
        </div>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="w-full bg-white text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Continue
          </button>
        )}
      </div>
    );
  }

  // The user already saved their own key.
  if (saved) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-300">Mistral API key saved</p>
            <p className="text-xs text-emerald-400/80 mt-1">
              Verified and encrypted. Semantic FAQ matching is now active for your account.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="flex-1 min-w-[160px] bg-white text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Continue
            </button>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Use a different key
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-purple-400" />
          Step 2 of 2 &mdash; Connect your AI
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Agent-FAQ uses <span className="text-gray-300">Mistral AI</span> to understand questions and
          match them to your FAQs. Add your free API key to switch the AI on.
        </p>
      </div>

      {/* Instructions */}
      <ol className="space-y-2 text-xs text-gray-400 bg-black/20 border border-white/10 rounded-xl p-4">
        <li className="flex gap-2">
          <span className="text-purple-400 font-semibold">1.</span>
          <span>
            Create a free account and grab a key at{" "}
            <a
              href={MISTRAL_KEYS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline inline-flex items-center gap-1"
            >
              console.mistral.ai/api-keys
              <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-purple-400 font-semibold">2.</span>
          <span>Click <span className="text-gray-300">Create new key</span>, give it any name.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-purple-400 font-semibold">3.</span>
          <span>Copy the key and paste it below. We verify it, then store it encrypted.</span>
        </li>
      </ol>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Mistral API key</label>
        <div className="relative">
          <input
            type={reveal ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="e.g. 8kLp3nQrT9xV2mZc"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 pr-20 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono"
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            {reveal ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-gray-500">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Your key is encrypted with AES-256-GCM before it is stored, and is never sent back to the
          browser. It is only used to call Mistral on your behalf.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || checking}
          className="flex items-center gap-2 bg-white text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save and continue
        </button>
        {skippable && (
          <button
            type="button"
            onClick={onDone}
            disabled={!onDone}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Skip for now
          </button>
        )}
      </div>
    </form>
  );
}

export default MistralKeyStep;