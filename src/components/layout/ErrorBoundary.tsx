'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UFM UI Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-navy-900 border border-red-500/40 rounded-2xl p-6 space-y-4 text-center">
            <h2 className="text-lg font-extrabold text-red-400">
              Something went wrong in the UI
            </h2>
            <p className="text-xs text-slate-300">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2 rounded-xl bg-pitch-600 text-white text-xs font-bold"
            >
              Recover View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
