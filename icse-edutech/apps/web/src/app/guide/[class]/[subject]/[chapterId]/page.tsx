"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight, ArrowLeft, BookOpen, Lightbulb,
  ListChecks, CheckCircle2, Circle, ChevronLeft, FlaskConical, BarChart3
} from "lucide-react";
import { getChapterGuide, getSubjectChapters } from "@/lib/api";
import { getSubjectDisplayName } from "@/lib/subjects";
import { markGuideComplete, isGuideComplete } from "@/lib/progress";
import TipCard from "@/components/TipCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import type { GuideData, Chapter, WorkedExample, Diagram } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMdTable(content: string) {
  const allLines = content.split("\n");
  const lines = allLines.filter((_l, idx) => idx !== 1);
  const split = (line: string) =>
    line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
  const [first, ...rest] = lines;
  return { headers: split(first ?? ""), rows: rest.map(split) };
}

function DiagramView({ diag }: { diag: Diagram }) {
  if (diag.type !== "table") {
    return (
      <pre className="text-xs text-muted font-mono whitespace-pre-wrap leading-relaxed bg-surface-hover rounded-lg p-3 overflow-x-auto">
        {diag.content}
      </pre>
    );
  }
  const parsed = parseMdTable(diag.content);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-surface-border">
            {parsed.headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left text-xs font-bold text-muted uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parsed.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-surface-border/50">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={
                    "px-3 py-2 text-left text-sm text-foreground" +
                    (ci === 0 ? " font-semibold" : "")
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkedExampleCard({ ex }: { ex: WorkedExample }) {
  return (
    <div className="card">
      <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-2">{ex.title}</p>
      <p className="text-sm font-semibold text-foreground mb-3">{ex.problem}</p>
      <div className="space-y-1.5 mb-3">
        {ex.steps.map((step, j) => (
          <div key={j} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
            <span className="text-green-400 font-bold shrink-0 mt-0.5 text-sm">
              {"Step " + String(j + 1) + "."}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
        <span className="text-xs font-bold text-green-400">{"Answer: "}</span>
        <span className="text-sm text-foreground">{ex.answer}</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const params = useParams<{ class: string; subject: string; chapterId: string }>();
  const router = useRouter();
  const classId = params.class;
  const subject = params.subject;
  const chapterId = params.chapterId;

  const [guide, setGuide] = useState<GuideData | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
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
        if (res.success && res.data) setGuide(res.data);
        else setError("Failed to load guide data");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load guide");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classId, subject, chapterId]);

  useEffect(() => {
    if (!classId || !subject) return;
    getSubjectChapters(classId, subject)
      .then((res) => { if (res.success && res.data) setChapters(res.data.chapters); })
      .catch(() => {});
  }, [classId, subject]);

  function handleMarkComplete() {
    if (!classId || !subject || !chapterId) return;
    markGuideComplete(classId, subject, chapterId);
    setCompleted(true);
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 2000);
  }

  const displaySubject = getSubjectDisplayName(subject);
  const chapterName = guide?.chapter?.name || chapterId.replace(/_/g, " ");

  const currentIdx = chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter =
    currentIdx >= 0 && currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;

  function goToChapter(ch: Chapter) {
    router.push("/guide/" + classId + "/" + subject + "/" + ch.id);
  }

  const tipsLabel = guide ? "Tips (" + guide.tips.length + ")" : "Tips";
  const examplesLabel = guide && guide.worked_examples
    ? "Worked Examples (" + guide.worked_examples.length + ")"
    : "Worked Examples";

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted mb-4 flex-wrap">
        <button
          onClick={() => router.back()}
          className="hover:text-foreground flex items-center gap-1 min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ChevronRight className="w-3 h-3" />
        <span>{"Class " + classId}</span>
        <ChevronRight className="w-3 h-3" />
        <button
          onClick={() => router.push("/subjects/" + classId + "/" + subject)}
          className="hover:text-foreground"
        >
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
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{chapterName}</h1>
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
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {justCompleted ? "+10 pts!" : "Done"}
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5" />
                  Mark Done
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted mb-6">
            {"Chapter " + guide.chapter.no + " • Class " + classId + " • " + displaySubject}
          </p>

          {/* Theory */}
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
                    <h3 className="text-sm font-bold text-foreground mb-3">Laws and Formulas</h3>
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
                  {"This chapter covers "}
                  <strong>{chapterName}</strong>
                  {"."}
                </p>
                <p className="text-sm text-muted leading-relaxed mt-3">
                  Key focus areas include understanding core definitions, applying formulas
                  correctly, and being able to solve problems step by step.
                </p>
              </div>
            )}
          </section>

          {/* Tips */}
          {guide.tips && guide.tips.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">{tipsLabel}</h2>
              </div>
              <div className="space-y-3">
                {guide.tips.map((tip, i) => (
                  <TipCard key={i} title={tip.title} trick={tip.trick} timeSaved={tip.time_saved} />
                ))}
              </div>
            </section>
          )}

          {/* Worked Examples */}
          {guide.worked_examples && guide.worked_examples.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">{examplesLabel}</h2>
              </div>
              <div className="space-y-4">
                {guide.worked_examples.map((ex: WorkedExample, i: number) => (
                  <WorkedExampleCard key={i} ex={ex} />
                ))}
              </div>
            </section>
          )}

          {/* Diagrams */}
          {guide.diagrams && guide.diagrams.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Diagrams and Summary Tables
                </h2>
              </div>
              <div className="space-y-4">
                {guide.diagrams.map((diag: Diagram, i: number) => (
                  <div key={i} className="card">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-3">
                      {diag.title}
                    </p>
                    <DiagramView diag={diag} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Practice MCQs */}
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
                <p className="text-xs text-muted mt-0.5">
                  Chapter-wise MCQs are being added. Check back soon.
                </p>
              </div>
              <span className="shrink-0 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-semibold border border-warning/20">
                Coming Soon
              </span>
            </div>
          </section>

          {/* Prev / Next navigation */}
          {(prevChapter || nextChapter) && (
            <div className="flex gap-3 mt-2 mb-8">
              {prevChapter ? (
                <button
                  onClick={() => goToChapter(prevChapter)}
                  className="flex-1 card hover:border-accent/25 hover:-translate-y-px transition-all duration-200 text-left p-3 group"
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-muted mb-1">
                    <ChevronLeft className="w-3 h-3" />
                    Previous
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                    {prevChapter.name}
                  </p>
                </button>
              ) : (
                <div className="flex-1" />
              )}

              {nextChapter ? (
                <button
                  onClick={() => goToChapter(nextChapter)}
                  className="flex-1 card hover:border-accent/25 hover:-translate-y-px transition-all duration-200 text-right p-3 group"
                >
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted mb-1">
                    Next
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                    {nextChapter.name}
                  </p>
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          )}
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
