"use client";

import { Calendar, Plus, MapPin, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_EVENTS = [
  {
    id: "1",
    name: "Global Tech Summit 2026",
    date: "Oct 15 - Oct 17, 2026",
    location: "San Francisco, CA",
    attendees: 5400,
    status: "active",
    image: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
  },
  {
    id: "2",
    name: "Developer Conference Q3",
    date: "Nov 2, 2026",
    location: "Virtual",
    attendees: 12000,
    status: "draft",
    image: "bg-gradient-to-br from-blue-600 to-cyan-500"
  }
];

export default function EventsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">Manage your events and AI contexts.</p>
        </div>
        <button className="bg-foreground text-background hover:bg-foreground/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_EVENTS.map((event) => (
          <div key={event.id} className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-muted-foreground/50 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer">
            <div className={cn("h-32 w-full", event.image)} />
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg leading-tight">{event.name}</h3>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                  event.status === "active" 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                )}>
                  {event.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {event.date}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {event.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> {event.attendees.toLocaleString()} expected
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm font-medium text-foreground group-hover:text-accent-foreground transition-colors">
                Manage Context
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}

        {/* Empty State / Create New Card */}
        <div className="rounded-xl border border-dashed border-border bg-transparent hover:bg-card/50 transition-colors flex flex-col items-center justify-center p-6 text-center min-h-[300px] cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
          </div>
          <h3 className="font-medium mb-1">Create New Event</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">Set up a new event and train the AI on its context.</p>
        </div>
      </div>
    </div>
  );
}
