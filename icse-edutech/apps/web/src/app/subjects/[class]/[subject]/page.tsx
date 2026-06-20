"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, BookOpen } from "lucide-react";
import { getSubjectChapters, getChapterTips } from "@/lib/api";
import { getSubjectDisplayName, getSubjectIcon, getSubjectColor } from "@/lib/subjects";
import ChapterCard from "@/components/ChapterCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import type { SubjectChaptersData } from "@/lib/types";

export default function SubjectPage() {
  const params = useParams<{ class: string; subject: string }>();
  const router = useRouter();
  const classId = params.class;
  const subject = params.subject;

  const [chaptersData, setChaptersData] = useState<SubjectChaptersData | null>(null);
  const [tipsMap, setTipsMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!classId || !subject) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getSubjectChapters(classId, subject);
        if (res.success && res.data) {
          setChaptersData(res.data);

          // Check which chapters have tips
          const tips: Record<string, boolean> = {};
          await Promise.all(
            res.data.chapters.map(async (ch) => {
              try {
                const tipRes = await getChapterTips(classId, subject, ch.id);
                tips[ch.id] = tipRes.success && tipRes.data && tipRes.data.count > 0;
              } catch {
                tips[ch.id] = false;
              }
            })
          );
          setTipsMap(tips);
        } else {
          setError("Failed to load chapters");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subject data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classId, subject]);

  const displayName = getSubjectDisplayName(subject);
  const icon = getSubjectIcon(subject);
  const color = getSubjectColor(subject);

  const handleStartWalkthrough = (chapterId: string) => {
    router.push(`/walkthrough/${classId}/${subject}/${chapterId}`);
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted mb-4">
        <button onClick={() => router.back()} className="hover:text-foreground flex items-center gap-1 min-h-[44px] min-w-[44px]">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ChevronRight className="w-3 h-3" />
        <span>Class {classId}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{displayName}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: color.bg }}
        >
          {icon}
        </div>
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold"
            style={{ color: color.primary }}
          >
            {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Class {classId} · {chaptersData?.totalChapters || "…"} chapters
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="list" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : chaptersData && chaptersData.chapters.length > 0 ? (
        <div className="space-y-3">
          {chaptersData.chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              hasTips={tipsMap[chapter.id] || false}
              onStartWalkthrough={() => handleStartWalkthrough(chapter.id)}
            />
           ))}
        </div>
      ) : (
        <div className="card text-center py-12 text-muted">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No chapters found for this subject.</p>
        </div>
      )}
    </div>
  );
}
