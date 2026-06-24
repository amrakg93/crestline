"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSubjectDisplayName, getSubjectIcon, getSubjectColor } from "@/lib/subjects";
import ProgressBar from "./ProgressBar";

interface SubjectCardProps {
  name: string; // raw subject key (e.g. "history_civics")
  totalChapters: number;
  completedChapters?: number;
  classId: string;
}

export default function SubjectCard({
  name,
  totalChapters,
  completedChapters = 0,
  classId,
}: SubjectCardProps) {
  const router = useRouter();
  const displayName = getSubjectDisplayName(name);
  const icon = getSubjectIcon(name);
  const color = getSubjectColor(name);
  const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  return (
    <button
      onClick={() => router.push(`/subjects/${classId}/${name}`)}
      className="card group relative overflow-hidden cursor-pointer text-left w-full
                 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 min-h-[44px]"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      {/* Top color strip — thickens on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 group-hover:h-1 transition-all duration-300 rounded-t-2xl"
        style={{ backgroundColor: color.primary }}
      />

      <div className="flex items-start justify-between mt-1 mb-3">
        <span className="text-2xl sm:text-3xl leading-none">{icon}</span>
        {progress >= 100 && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: color.bg, color: color.primary }}
          >
            ✓ Done
          </span>
        )}
      </div>

      <h3
        className="text-sm sm:text-base font-bold mb-1 leading-tight transition-colors duration-200"
        style={{ color: color.primary }}
      >
        {displayName}
      </h3>
      <p className="text-xs text-muted mb-3">
        {completedChapters}/{totalChapters} chapters
      </p>

      <div className="flex items-center justify-between">
        <ProgressBar progress={progress} size="sm" className="flex-1 mr-3" />
        <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
      </div>
    </button>
  );
}
