'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger/10 border border-danger/20 mb-6">
          <AlertTriangle className="h-10 w-10 text-danger" />
        </div>
        <h1 className="text-2xl font-heading font-bold mb-3">Something Went Wrong</h1>
        <p className="text-text-secondary max-w-sm mx-auto mb-8">
          An unexpected error occurred. Please try again or return to the home page.
        </p>
        {error.digest && (
          <p className="text-text-tertiary text-xs font-mono mb-6">Error ID: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-accent-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-white/[0.12] text-text-secondary px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/[0.04] transition-colors"
          >
            <Home className="h-4 w-4" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
