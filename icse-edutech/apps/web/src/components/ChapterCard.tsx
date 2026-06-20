"use client";

import { Lightbulb, Play } from "lucide-react";
import type { Chapter } from "@/lib/types";

interface ChapterCardProps {
  chapter: Chapter;
  hasTips: boolean;
  onStartWalkthrough: () => void;
}

export default function ChapterCard({
  chapter,
  hasTips,
  onStartWalkthrough,
}: ChapterCardProps) {
  return (
    <div
      className="card flex items-center gap-4 hover:border-accent/25 hover:-translate-y-px
                 transition-all duration-200 group cursor-pointer"
      onClick={onStartWalkthrough}
    >
      {/* Chapter number badge */}
      <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-xs shrink-0 group-hover:bg-accent/20 transition-colors duration-200">
        {chapter.no}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground leading-snug">{chapter.name}</h3>
        <p className="text-[11px] text-muted mt-0.5 flex items-center gap-2">
          Chapter {chapter.no}
          {hasTips && (
            <span className="inline-flex items-center gap-0.5 text-accent">
              <Lightbulb className="w-3 h-3" />
              Tips
            </span>
          )}
        </p>
      </div>

      {/* CTA button — stops propagation so card click and button click both work */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStartWalkthrough();
        }}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold
                   transition-all duration-200"
      >
        <Play className="w-3 h-3" />
        Start
      </button>
    </div>
  );
}
