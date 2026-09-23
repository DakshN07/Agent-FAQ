"use client";

import { useEffect } from "react";
import Sentry from "@/lib/sentry";
import { getStoredUser } from "@/lib/api";

/**
 * Initializes client-side Sentry and tags events with the signed-in user.
 * Rendered once inside the root layout — errors in any child are reported
 * automatically (Sentry patches window.onerror/unhandledrejection).
 */
export default function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const user = getStoredUser();
    if (user && (user.id || user.email || user.username)) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    }
    return () => Sentry.setUser(null);
  }, []);

  return <>{children}</>;
}