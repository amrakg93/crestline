"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { getWalkthrough } from "@/lib/api";
import { getSubjectDisplayName } from "@/lib/subjects";
import WalkthroughLevelCard from "@/components/WalkthroughLevel";
import ProgressBar from "@/components/ProgressBar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import type { WalkthroughData, WalkthroughGuide } from "@/lib/types";

export default function WalkthroughPage() {
  const params = useParams<{ class: string; subject: string; chapterId: string }>();
  const router = useRouter();
  const classId = params.class;
  const subject = params.subject;
  const chapterId = params.chapterId;

  const [walkthrough, setWalkthrough] = useState<WalkthroughData | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));
  const [completedGuides, setCompletedGuides] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!classId || !subject || !chapterId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getWalkthrough(classId, subject, chapterId);
        if (res.success && res.data) {
          setWalkthrough(res.data);
        } else {
          setError("Failed to load walkthrough data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load walkthrough");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classId, subject, chapterId]);

  const displaySubject = getSubjectDisplayName(subject);

  // Derive display for breadcrumb
  const chapterName = walkthrough?.target?.chapterName || chapterId.replace(/_/g, " ");

  // Calculate progress
  const totalGuides = walkthrough
    ? walkthrough.levels.reduce((sum, l) => sum + l.guides.length, 0)
    : 0;
  const completed = walkthrough
    ? walkthrough.levels.reduce(
        (sum, l) => sum + l.guides.filter((g) => completedGuides.has(g.id)).length,
        0
      )
    : 0;
  const progress = totalGuides > 0 ? (completed / totalGuides) * 100 : 0;

  const toggleLevel = (level: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const toggleGuideComplete = (guideId: string) => {
    setCompletedGuides((prev) => {
      const next = new Set(prev);
      if (next.has(guideId)) {
        next.delete(guideId);
      } else {
        next.add(guideId);
      }
      return next;
    });
  };

  const handleStartGuide = (guide: WalkthroughGuide) => {
    router.push(`/guide/${guide.class}/${guide.subject}/${guide.id}`);
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted mb-4 flex-wrap">
        <button onClick={() => router.back()} className="hover:text-foreground flex items-center gap-1 min-h-[44px] min-w-[44px]">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ChevronRight className="w-3 h-3" />
        <span>Class {classId}</span>
        <ChevronRight className="w-3 h-3" />
        <button
          onClick={() => router.push(`/subjects/${classId}/${subject}`)}
          className="hover:text-foreground"
        >
          {displaySubject}
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate">{chapterName}</span>
      </div>

      {loading ? (
        <LoadingSkeleton type="full" count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : walkthrough ? (
        <>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
              {chapterName}
            </h1>
            <div className="flex items-center gap-3">
              <ProgressBar progress={progress} size="md" className="max-w-[200px]" showLabel />
              <span className="text-xs text-muted">
                {completed}/{totalGuides} guides
              </span>
            </div>
          </div>

          {/* Levels */}
          <div>
            {walkthrough.levels.map((level) => (
              <div key={level.level}>
                <WalkthroughLevelCard
                  level={level}
                  isExpanded={expandedLevels.has(level.level)}
                  onToggle={() => toggleLevel(level.level)}
                  onStartGuide={(guide) => {
                    toggleGuideComplete(guide.id);
                    handleStartGuide(guide);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Empty state */}
          {walkthrough.levels.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-muted text-sm">No walkthrough levels available yet for this chapter.</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
