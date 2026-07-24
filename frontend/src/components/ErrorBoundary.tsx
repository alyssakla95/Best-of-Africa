import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React component error:', error, errorInfo);
    // A failed dynamic import almost always means the page is running an old build
    // whose chunk hashes no longer exist on the server. Reload once (guarded) to
    // fetch the current build instead of stranding the user on this screen.
    const msg = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();
    const isChunkError =
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch') ||
      msg.includes('importing a module script failed') ||
      msg.includes('chunkloaderror') ||
      msg.includes('loading chunk');
    if (isChunkError && !sessionStorage.getItem('boa-eb-reloaded')) {
      sessionStorage.setItem('boa-eb-reloaded', '1');
      window.location.reload();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-background border border-accent/30 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <ShieldAlert size={32} className="text-accent" />
            </div>

            <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              Something went wrong
            </h1>

            <p className="text-foreground/60 mb-8 leading-relaxed">
              This page didn't load properly. Reloading usually fixes it, you might
              just be on an older version of the site.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-accent text-navy py-3 rounded-lg font-semibold hover:bg-gold-italic transition-colors uppercase tracking-wider text-sm mb-3"
            >
              Reload this page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="w-full border border-accent/40 text-foreground py-3 rounded-lg font-semibold hover:bg-accent/10 transition-colors uppercase tracking-wider text-sm mb-4"
            >
              Back to home
            </button>
            <p className="text-foreground/30 text-xs">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
