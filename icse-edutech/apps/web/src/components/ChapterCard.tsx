"use client";

import { Lightbulb, CheckCircle2, BookOpen } from "lucide-react";
import type { Chapter } from "@/lib/types";

interface ChapterCardProps {
  chapter: Chapter;
  hasTips: boolean;
  isCompleted: boolean;
  onStart: () => void;
}

export default function ChapterCard({ chapter, hasTips, isCompleted, onStart }: ChapterCardProps) {
  return (
    <div
      className={[
        "card flex items-center gap-4 hover:border-accent/25 hover:-translate-y-px",
        "transition-all duration-200 group cursor-pointer",
        isCompleted ? "opacity-75" : "",
      ].join(" ")}
      onClick={onStart}
    >
      {/* Chapter number badge */}
      <div className={[
        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors duration-200",
        isCompleted
          ? "bg-success/15 text-success"
          : "bg-accent/10 text-accent group-hover:bg-accent/20",
      ].join(" ")}>
        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : chapter.no}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <h3 className={[
          "font-semibold text-sm leading-snug",
          isCompleted ? "line-through text-muted" : "text-foreground",
        ].join(" ")}>{chapter.name}</h3>
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

      {/* CTA */}
      <button
        onClick={(e) => { e.stopPropagation(); onStart(); }}
        className={[
          "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
          isCompleted
            ? "bg-success/10 text-success border border-success/20"
            : "bg-accent/10 hover:bg-accent/20 text-accent",
        ].join(" ")}
      >
        <BookOpen className="w-3 h-3" />
        {isCompleted ? "Review" : "Study"}
      </button>
    </div>
  );
}
