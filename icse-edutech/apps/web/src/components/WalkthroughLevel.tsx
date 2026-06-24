"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { WalkthroughLevel, WalkthroughGuide } from "@/lib/types";
import { getSubjectDisplayName } from "@/lib/subjects";

interface WalkthroughLevelProps {
  level: WalkthroughLevel;
  isExpanded: boolean;
  onToggle: () => void;
  onStartGuide: (guide: WalkthroughGuide) => void;
}

export default function WalkthroughLevelCard({
  level,
  isExpanded,
  onToggle,
  onStartGuide,
}: WalkthroughLevelProps) {
  return (
    <div className="mb-4">
      {/* Level Header */}
      <button
        onClick={onToggle}
        className="w-full card flex items-center gap-3 hover:border-accent/30 transition-all duration-200 min-h-[44px] text-left"
      >
        <span className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
          {level.level}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">
            Level {level.level}
          </h3>
          <p className="text-[11px] text-muted">
            {level.guides.length} prerequisite guide{level.guides.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted shrink-0" />
        )}
      </button>

      {/* Expandable Guides */}
      {isExpanded && (
        <div className="ml-4 pl-4 border-l-2 border-accent/20 mt-2 space-y-2 animate-slide-up">
          {level.guides.map((guide) => (
            <div
              key={guide.id}
              className="card flex items-center justify-between gap-3 hover:border-accent/30 transition-all"
            >
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {guide.chapterName}
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Class {guide.class} • {getSubjectDisplayName(guide.subject)}
                </p>
              </div>
              <button
                onClick={() => onStartGuide(guide)}
                className="btn-primary text-xs py-2 px-3 shrink-0"
              >
                Start
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
