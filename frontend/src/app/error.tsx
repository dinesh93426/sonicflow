'use client';

import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4 space-y-4 select-none">
      <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-white">Something went wrong</h2>
      <p className="text-xs text-muted max-w-sm">
        {error.message || 'An unexpected error occurred while loading this view.'}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 rounded-full bg-surface-elevated hover:bg-surface-hover text-white text-xs font-semibold border border-surface-border"
      >
        Try Again
      </button>
    </div>
  );
}
