"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, ChevronRight, Loader2, Hash } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getEvents()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setEvents(data);
      })
      .catch((e: any) => {
        if (!cancelled) setLoadError(e?.message || "Could not load events");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">Manage your events and AI contexts.</p>
        </div>
        <Link
          href="/dashboard/events/create"
          className="bg-foreground text-background hover:bg-foreground/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading events…
        </div>
      ) : loadError ? (
        <div className="py-16 text-center text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl">
          {loadError}
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No events yet</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
            Create your first event to start training the AI on its context.
          </p>
          <Link
            href="/dashboard/events/create"
            className="bg-foreground text-background hover:bg-foreground/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <div
              key={event._id || event.inviteCode || i}
              className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-muted-foreground/50 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
            >
              <div className={`h-32 w-full bg-gradient-to-br ${i % 3 === 0 ? "from-indigo-500 via-purple-500 to-pink-500" : i % 3 === 1 ? "from-blue-600 to-cyan-500" : "from-emerald-600 to-teal-500"}`} />
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg leading-tight">{event.name}</h3>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                )}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : "—"}
                  </div>
                  {event.inviteCode && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      <span className="font-mono">{event.inviteCode}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm font-medium text-foreground group-hover:text-accent-foreground transition-colors">
                  Manage Event
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}

          {/* Empty State / Create New Card */}
          <Link
            href="/dashboard/events/create"
            className="rounded-xl border border-dashed border-border bg-transparent hover:bg-card/50 transition-colors flex flex-col items-center justify-center p-6 text-center min-h-[300px] cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
            </div>
            <h3 className="font-medium mb-1">Create New Event</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">Set up a new event and train the AI on its context.</p>
          </Link>
        </div>
      )}
    </div>
  );
}