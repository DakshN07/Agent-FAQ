"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Inbox, 
  CalendarDays, 
  Plug, 
  Users, 
  Settings,
  Sparkles
} from "lucide-react";

import { ShieldAlert, Bot } from "lucide-react";

const navItems = [
  { name: "Unified Inbox", href: "/dashboard/inbox", icon: Inbox },
  { name: "Moderation", href: "/dashboard/moderation", icon: ShieldAlert },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot },
  { name: "Events", href: "/dashboard/events", icon: CalendarDays },
  { name: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{name: string, org?: string, plan: string} | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const displayName = user?.org || user?.name || "Guest";
  const displayPlan = user?.plan || "Free Tier";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-background/50 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          Agent-FAQ
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{displayPlan}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
