"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Check, AlertCircle, Download, Hash } from "lucide-react";
import { api } from "@/lib/api";

/**
 * Import existing Q&A from a connected channel.
 *
 * A pinned message becomes an FAQ when it has at least one reply — the pin is
 * the question, the first reply is the answer. That matches how people already
 * use pins ("pin the question, answer it in the thread"), so the import is
 * something they can predict rather than a black box.
 *
 * Only Discord and Slack support this. Telegram bots cannot read chat history,
 * so the button isn't offered there.
 */

type Props = {
  eventId: string;
  platform: "discord" | "slack";
  platformName: string;
  onClose: () => void;
  onImported: () => void;
};

export default function ImportFaqsDialog({ eventId, platform, platformName, onClose, onImported }: Props) {
  const [sources, setSources] = useState<{ id: string; name: string; topic?: string }[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getImportSources(eventId, platform)
      .then((res) => {
        if (cancelled) return;
        setSources(res.sources || []);
        // Pre-select the first few — usually the right guess, and the user can
        // adjust rather than starting from nothing.
        setSelected(new Set((res.sources || []).slice(0, 3).map((s) => s.id)));
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || "Could not list channels.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, platform]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    setError(null);
    setImporting(true);
    try {
      const res = await api.importFaqs(eventId, platform, Array.from(selected));
      setResult({ imported: res.imported, skipped: res.skipped, message: res.message });
      onImported();
    } catch (e: any) {
      setError(e?.message || "The import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-faqs-title"
      >
        <div className="flex items-start justify-between mb-1">
          <h2 id="import-faqs-title" className="text-lg font-semibold">
            Import FAQs from {platformName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Pick the channels to pull from. A <strong>pinned message with a reply</strong> becomes one FAQ — the
          pin is the question, the first reply is the answer.
        </p>

        {result ? (
          <div className="mt-4 space-y-3">
            <div
              className={`flex items-start gap-2 p-3 text-sm border rounded-lg ${
                result.imported > 0
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}
            >
              {result.imported > 0 ? (
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{result.message}</span>
            </div>
            {result.skipped > 0 && (
              <p className="text-xs text-muted-foreground">
                {result.skipped} pinned message{result.skipped === 1 ? "" : "s"} were skipped because they
                had no reply or were too short to be a real question.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Imported FAQs appear in your Knowledge page, where you can edit or delete them.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : sources && sources.length > 0 ? (
              <ul className="space-y-1">
                {sources.map((source) => {
                  const checked = selected.has(source.id);
                  return (
                    <li key={source.id}>
                      <label
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          checked
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : "border-border hover:bg-accent/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(source.id)}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                        <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm truncate">{source.name}</span>
                          {source.topic && (
                            <span className="block text-xs text-muted-foreground truncate">{source.topic}</span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-6 text-sm text-muted-foreground text-center">
                No readable channels found. Make sure the bot has been added to the server and can see the
                channels you want to import from.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-start gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            {result ? "Done" : "Cancel"}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Import{selected.size > 0 ? ` from ${selected.size}` : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
