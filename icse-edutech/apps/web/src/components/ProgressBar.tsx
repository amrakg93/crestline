"use client";

import clsx from "clsx";

interface ProgressBarProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  size = "md",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3" };

  const getColor = (p: number) => {
    if (p >= 100) return "bg-success";
    return "bg-accent";
  };

  return (
    <div className={clsx("flex items-center gap-2 w-full", className)}>
      <div
        className={clsx(
          "flex-1 rounded-full bg-surface-hover overflow-hidden",
          heights[size]
        )}
      >
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-700 ease-out",
            getColor(clampedProgress)
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-foreground whitespace-nowrap tabular-nums">
          {Math.round(clampedProgress)}%
        </span>
      )}
    </div>
  );
}
