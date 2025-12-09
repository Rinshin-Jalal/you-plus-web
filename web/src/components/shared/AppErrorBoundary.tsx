'use client';

import React from 'react';

export interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Surface to monitoring when wired (e.g., Sentry)
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full border border-white/10 flex items-center justify-center">
            <span className="text-lg font-mono">!</span>
          </div>
          <h1 className="text-2xl font-bold">Something broke.</h1>
          <p className="text-white/60 text-sm">
            We hit an unexpected error. Try again, or head back to the start.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={this.handleReset}
              className="py-3 px-4 bg-[#F97316] text-black font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="py-2 px-4 text-white/70 hover:text-white text-sm transition-colors"
            >
              Go home
            </button>
          </div>
          {this.state.error && (
            <p className="text-xs text-white/30 font-mono break-words">
              {this.state.error.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
