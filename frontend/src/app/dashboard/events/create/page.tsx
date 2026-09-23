"use client";

import { useState } from "react";
import { Sparkles, Calendar, Clock, MapPin, Tag, Gift, Type, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, setStoredActiveEventId, getStoredUser } from "@/lib/api";

export default function CreateEventPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);
    try {
      const res = await api.createEvent({
        name: eventData.name,
        description: eventData.description,
        // Ask the backend to enrich the description from the extra details.
        useAIIntro: true,
        details: {
          date: eventData.date,
          time: eventData.time,
          venue: eventData.venue,
          event_type: eventData.event_type,
          goodies: eventData.goodies,
          contactNumber: getStoredUser()?.phoneNumber || "",
        },
      });
      if (res?.event?._id) {
        setStoredActiveEventId(res.event._id);
        router.push("/dashboard");
      } else {
        setSaveError("Event was created but no ID was returned. Please check your event list.");
      }
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
          Create Event
        </h1>
        <p className="text-gray-400 mt-2">
          Set up an event context. The AI assistant auto-generates a starter FAQ set after you save
          (using Mistral/Gemini when configured).
        </p>
      </div>

      {saveError && (
        <div className="mb-6 flex items-center gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Event Form Section */}
      <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
        <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-4">Event Details</h2>
        
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
              placeholder="Optional — if left empty, the AI will generate a description from the details above."
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500/50 outline-none min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <span className="text-[11px] text-gray-500 flex items-center gap-1.5 mr-auto">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Starter FAQs are generated automatically on save.
          </span>
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-white text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Event
          </button>
        </div>
      </form>
    </div>
  );
}