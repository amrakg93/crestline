"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface ClassSelectorProps {
  selectedClass: string;
  onSelect: (classId: string) => void;
  classes?: string[];
}

const DEFAULT_CLASSES = ["8", "9", "10"];

export default function ClassSelector({
  selectedClass,
  onSelect,
  classes = DEFAULT_CLASSES,
}: ClassSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 w-full sm:w-auto",
          "bg-surface border-surface-border hover:border-accent/50",
          "text-foreground font-semibold text-sm",
          "min-h-[44px]"
        )}
      >
        <span className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
          {selectedClass}
        </span>
        <span>Class {selectedClass}</span>
        <ChevronDown
          className={clsx(
            "w-4 h-4 transition-transform duration-200 ml-auto sm:ml-1",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-1 left-0 right-0 sm:right-auto bg-surface border border-surface-border rounded-xl shadow-xl z-20 overflow-hidden animate-slide-up">
            {classes.map((cls) => (
              <button
                key={cls}
                onClick={() => {
                  onSelect(cls);
                  setIsOpen(false);
                }}
                className={clsx(
                  "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors min-h-[44px]",
                  "hover:bg-surface-hover",
                  selectedClass === cls
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground"
                )}
              >
                <span
                  className={clsx(
                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                    selectedClass === cls
                      ? "bg-accent/20 text-accent"
                      : "bg-surface-hover text-muted-foreground"
                  )}
                >
                  {cls}
                </span>
                Class {cls}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
