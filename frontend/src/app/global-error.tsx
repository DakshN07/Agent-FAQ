"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Next.js root error boundary (App Router). Catches errors in the root
 * layout, reports them to Sentry, and offers a recovery action.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#060606] text-white flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-sm text-gray-400">
            An unexpected error occurred on this page. The team has been notified.
          </p>
          <button
            onClick={reset}
            className="mt-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}