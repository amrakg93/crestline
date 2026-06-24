"use client";

import { Lightbulb, Clock } from "lucide-react";
import type { GuideTip } from "@/lib/types";

interface TipCardProps {
  title?: string;
  trick: string;
  timeSaved?: string;
  tip?: GuideTip;
}

export default function TipCard({ title, trick, timeSaved, tip }: TipCardProps) {
  // Support both direct props and tip object
  const displayTitle = tip?.title || title || "Tip";
  const displayTrick = tip?.trick || trick;
  const displayTimeSaved = tip?.time_saved || timeSaved || "";

  // Color coding based on title keywords
  const isShortcut = displayTitle.toLowerCase().includes("shortcut") || displayTitle.toLowerCase().includes("speed");
  const isMistake = displayTitle.toLowerCase().includes("mistake") || displayTitle.toLowerCase().includes("common");
  const isTrick = !isShortcut && !isMistake;

  const bgClass = isShortcut
    ? "bg-accent/5 border-accent/30"
    : isMistake
    ? "bg-warning/5 border-warning/30"
    : "bg-purple-500/5 border-purple-500/30";

  const iconColor = isShortcut ? "text-accent" : isMistake ? "text-warning" : "text-purple-400";
  const labelColor = isShortcut ? "text-accent" : isMistake ? "text-warning" : "text-purple-400";
  const label = isShortcut ? "Shortcut" : isMistake ? "Watch Out" : "Trick";
  const Icon = isShortcut ? Clock : isMistake ? Lightbulb : Lightbulb;

  return (
    <div className={`border rounded-xl p-4 ${bgClass} transition-all duration-200 hover:shadow-lg`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${labelColor}`}>
              {label}
            </span>
            {displayTimeSaved && (
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold">
                ⚡ {displayTimeSaved}
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1">{displayTitle}</h4>
          <p className="text-xs text-muted leading-relaxed">{displayTrick}</p>
        </div>
      </div>
    </div>
  );
}
