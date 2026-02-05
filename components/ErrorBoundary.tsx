import React, { Component, ReactNode } from 'react';

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-k5-deepBlue to-k5-digitalBlue p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-k5-deepBlue">
            <div className="mb-6 text-center">
              <div className="mb-4 text-6xl">⚠️</div>
              <h1 className="mb-2 text-2xl font-black text-k5-deepBlue dark:text-white">
                Ups, etwas ist schiefgelaufen
              </h1>
              <p className="text-sm text-k5-sand">
                Die Anwendung ist auf einen unerwarteten Fehler gestoßen.
              </p>
            </div>

            <div className="mb-6 rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                Fehlerdetails:
              </p>
              <p className="font-mono text-sm text-red-800 dark:text-red-300">
                {this.state.error?.message || 'Unbekannter Fehler'}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-2xl bg-k5-lime py-4 text-sm font-black uppercase tracking-widest text-k5-deepBlue shadow-xl transition-all hover:brightness-110"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
