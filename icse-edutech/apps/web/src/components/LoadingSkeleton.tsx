"use client";

interface LoadingSkeletonProps {
  type?: "card" | "list" | "full";
  count?: number;
}

export default function LoadingSkeleton({ type = "card", count = 4 }: LoadingSkeletonProps) {
  if (type === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card flex items-center gap-3 animate-pulse">
            <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton w-3/4 h-4" />
              <div className="skeleton w-1/2 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "full") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton w-48 h-6" />
        <div className="card space-y-4">
          <div className="skeleton w-3/4 h-5" />
          <div className="skeleton w-full h-2 rounded-full" />
          <div className="skeleton w-1/2 h-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton w-24 h-5" />
              <div className="skeleton w-full h-1.5 rounded-full" />
              <div className="skeleton w-16 h-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: card grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 animate-pulse">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-24 h-5" />
          <div className="skeleton w-full h-1.5 rounded-full" />
          <div className="skeleton w-16 h-3" />
        </div>
      ))}
    </div>
  );
}
