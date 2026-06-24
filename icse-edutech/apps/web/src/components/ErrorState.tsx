"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="card text-center py-12 sm:py-16">
      <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-danger" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-muted mb-5 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
