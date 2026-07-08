'use client';

import React from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorBoundaryProps) {
  React.useEffect(() => {
    // Log the error to an error tracking service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 text-sm mb-6">
            An unexpected error occurred while rendering this page.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 mb-2">
                Error Details (Dev Only)
              </summary>
              <pre className="bg-gray-900/50 text-red-400 text-xs p-3 rounded overflow-auto max-h-32">
                {error.message}
              </pre>
            </details>
          )}
          
          <button
            onClick={() => reset()}
            className="w-full bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
