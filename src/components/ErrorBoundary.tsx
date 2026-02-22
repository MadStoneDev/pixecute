"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Pixecute Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-neutral-100 p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-neutral-400 mb-6 text-center max-w-md">
            The editor encountered an unexpected error. Your artwork is saved
            automatically, so you shouldn&apos;t lose any work.
          </p>
          <pre className="text-xs text-red-400 bg-neutral-800 p-4 rounded-lg mb-6 max-w-lg overflow-auto">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded-lg font-medium transition-colors"
          >
            Reload Editor
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
