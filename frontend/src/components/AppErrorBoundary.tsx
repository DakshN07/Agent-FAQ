"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * React error boundary for dashboard sections. Reports the error to Sentry
 * (with component stack) and renders a fallback instead of a blank white
 * screen, so one broken panel never takes down the whole dashboard.
 */
export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack || null },
    });
  }

  componentDidUpdate(prevProps: Props) {
    // Reset when the child content changes (e.g. switching tabs).
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-sm font-bold text-white mb-1">This section hit an error</h3>
            <p className="text-xs text-gray-500">
              The error was reported. Try switching tabs or reload the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}