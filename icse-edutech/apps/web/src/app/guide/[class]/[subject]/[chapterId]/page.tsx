"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, BookOpen, Lightbulb, ListChecks, CheckCircle2, Circle } from "lucide-react";
import { getChapterGuide } from "@/lib/api";
import { getSubjectDisplayName } from "@/lib/subjects";
import { markGuideComplete, isGuideComplete } from "@/lib/progress";
import TipCard from "@/components/TipCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import type { GuideData } from "@/lib/types";

export default function GuidePage() {
  const params = useParams<{ class: string; subject: string; chapterId: string }>();
  const router = useRouter();
  const classId = params.class;
  const subject = params.subject;
  const chapterId = params.chapterId;

  const [guide, setGuide] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (classId && subject && chapterId) {
      setCompleted(isGuideComplete(classId, subject, chapterId));
    }
  }, [classId, subject, chapterId]);

  useEffect(() => {
    async function load() {
      if (!classId || !subject || !chapterId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getChapterGuide(classId, subject, chapterId);
        if (res.success && res.data) {
          setGuide(res.data);
        } else {
          setError("Failed to load guide data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load guide");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classId, subject, chapterId]);

  function handleMarkComplete() {
    if (!classId || !subject || !chapterId) return;
    markGuideComplete(classId, subject, chapterId);
    setCompleted(true);
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 2000);
  }

  const displaySubject = getSubjectDisplayName(subject);
  const chapterName = guide?.chapter?.name || chapterId.replace(/_/g, " ");

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted mb-4 flex-wrap">
        <button onClick={() => router.back()} className="hover:text-foreground flex items-center gap-1 min-h-[44px] min-w-[44px]">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ChevronRight className="w-3 h-3" />
        <span>Class {classId}</span>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => router.push(`/subjects/${classId}/${subject}`)} className="hover:text-foreground">
          {displaySubject}
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate">{chapterName}</span>
      </div>

      {loading ? (
        <LoadingSkeleton type="full" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : guide ? (
        <>
          {/* Title */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{chapterName}</h1>
            {/* Mark Complete button */}
            <button
              onClick={handleMarkComplete}
              disabled={completed}
              className={[
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
                completed
                  ? "bg-success/10 border-success/20 text-success cursor-default"
                  : "bg-surface-hover border-surface-border text-muted hover:text-foreground hover:border-accent/30",
              ].join(" ")}
            >
              {completed ? (
                <><CheckCircle2 className="w-3.5 h-3.5" />{justCompleted ? "+10 pts!" : "Done"}</>
              ) : (
                <><Circle className="w-3.5 h-3.5" />Mark Done</>
              )}
            </button>
          </div>
          <p className="text-xs text-muted mb-6">
            Chapter {guide.chapter.no} &bull; Class {classId} &bull; {displaySubject}
          </p>

          {/* Theory Section */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Theory</h2>
            </div>

            {guide.overview ? (
              <div className="space-y-4">
                <div className="card">
                  <p className="text-sm text-foreground leading-relaxed">{guide.overview}</p>
                </div>

                {guide.key_concepts && guide.key_concepts.length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-bold text-foreground mb-3">Key Concepts</h3>
                    <dl className="space-y-3">
                      {guide.key_concepts.map((kc, i) => (
                        <div key={i}>
                          <dt className="text-sm font-semibold text-blue-400">{kc.term}</dt>
                          <dd className="text-sm text-muted leading-relaxed mt-0.5">{kc.definition}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {guide.laws_and_formulas && guide.laws_and_formulas.length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-bold text-foreground mb-3">Laws &amp; Formulas</h3>
                    <div className="space-y-3">
                      {guide.laws_and_formulas.map((lf, i) => (
                        <div key={i}>
                          <p className="text-sm font-semibold text-foreground">{lf.name}</p>
                          {lf.formula && (
                            <p className="text-sm font-mono text-accent bg-accent/10 rounded-lg px-3 py-1.5 mt-1 inline-block">
                              {lf.formula}
                            </p>
                          )}
                          {lf.statement && (
                            <p className="text-sm text-muted leading-relaxed mt-1">{lf.statement}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {guide.key_points && guide.key_points.length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-bold text-foreground mb-3">Key Points to Remember</h3>
                    <ul className="space-y-2">
                      {guide.key_points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                          <span className="text-accent font-bold mt-0.5 shrink-0">&bull;</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <p className="text-sm text-foreground leading-relaxed">
                  This chapter covers <strong>{chapterName}</strong>.
                </p>
                <p className="text-sm text-muted leading-relaxed mt-3">
                  Key focus areas include understanding core definitions, applying formulas correctly,
                  and being able to solve problems step by step.
                </p>
              </div>
            )}
          </section>

          {/* Tips Section */}
          {guide.tips && guide.tips.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Tips &amp; Tricks ({guide.tips.length})
                </h2>
              </div>
              <div className="space-y-3">
                {guide.tips.map((tip, i) => (
                  <TipCard key={i} title={tip.title} trick={tip.trick} timeSaved={tip.time_saved} />
                ))}
              </div>
            </section>
          )}

          {/* Practice MCQ Section */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Practice MCQs</h2>
            </div>
            <div className="card border-dashed flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Chapter Quiz</p>
                <p className="text-xs text-muted mt-0.5">Chapter-wise MCQs are being added — check back soon.</p>
              </div>
              <span className="shrink-0 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-semibold border border-warning/20">
                Coming Soon
              </span>
            </div>
          </section>
        </>
      ) : (
        <div className="card text-center py-12 text-muted">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No guide available for this chapter.</p>
        </div>
      )}
    </div>
  );
}
