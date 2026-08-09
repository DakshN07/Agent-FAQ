"use client";

import { useState } from "react";
import { Sparkles, Calendar, Clock, MapPin, Tag, Gift, Type, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch, setCurrentEventId } from "@/lib/api";

export default function CreateEventPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [eventData, setEventData] = useState({
    name: "",
    date: "",
    time: "",
    venue: "",
    event_type: "",
    description: "",
    goodies: ""
  });
  const router = useRouter();

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    
    try {
      setError("");
      const draft = await apiFetch<typeof eventData>("/events/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      setEventData(draft);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate event.");
      console.error("Failed to generate event", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const descriptionParts = [
        eventData.description,
        eventData.event_type && `Type: ${eventData.event_type}`,
        eventData.date && `Date: ${eventData.date}`,
        eventData.time && `Time: ${eventData.time}`,
        eventData.venue && `Venue: ${eventData.venue}`,
        eventData.goodies && `Goodies: ${eventData.goodies}`,
      ].filter(Boolean);

      const response = await apiFetch<{ event: { _id: string } }>("/events", {
        method: "POST",
        body: JSON.stringify({
          name: eventData.name,
          description: descriptionParts.join("\n"),
          details: {
            date: eventData.date,
            startTime: eventData.time,
            location: eventData.venue,
            prizes: eventData.goodies,
            theme: eventData.event_type,
          },
        }),
      });
      setCurrentEventId(response.event._id);
      router.push("/dashboard/inbox");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save event.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
          Create Event with AI
        </h1>
        <p className="text-gray-400 mt-2">
          Describe your event naturally and let our AI fill out the details.
        </p>
      </div>

      {/* AI Prompt Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-md">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Describe your event (The &quot;Bestest&quot; Way)
        </label>
        <div className="relative">
          <textarea
            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none min-h-[120px] resize-y"
            placeholder="e.g. Create an ETH Global hackathon in India next month. Venue is KTPO Bengaluru. Give out t-shirts and hoodies as goodies."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 transition-all"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? "Generating..." : "Generate Magic"}
          </button>
        </div>
      </div>

      {/* Event Form Section */}
      <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
        <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-4">Event Details</h2>
        
        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-400" /> Event Name
            </label>
            <input 
              name="name" value={eventData.name} onChange={handleChange} required
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-400" /> Event Type
            </label>
            <input 
              name="event_type" value={eventData.event_type} onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> Date
            </label>
            <input 
              name="date" value={eventData.date} onChange={handleChange} type="date"
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Time
            </label>
            <input 
              name="time" value={eventData.time} onChange={handleChange} type="time"
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" /> Venue
            </label>
            <input 
              name="venue" value={eventData.venue} onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-400" /> Goodies
            </label>
            <input 
              name="goodies" value={eventData.goodies} onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-400" /> Description
            </label>
            <textarea 
              name="description" value={eventData.description} onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500/50 outline-none min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-white text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
            Save Event
          </button>
        </div>
      </form>
    </div>
  );
}
