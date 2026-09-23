// Client-side Sentry bootstrap. Imported by SentryProvider (a "use client"
// component), so this module runs in the browser bundle. Errors only go to
// Sentry when NEXT_PUBLIC_SENTRY_DSN is configured — local dev stays silent.
import * as Sentry from "@sentry/nextjs";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NEXT_PUBLIC_APP_ENV || "production",
  });
}

export default Sentry;