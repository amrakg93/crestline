"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Loader2, Flame, Star, Trophy } from "lucide-react";
import ClassSelector from "@/components/ClassSelector";
import SubjectCard from "@/components/SubjectCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import type { SyllabusClassesData } from "@/lib/types";
import { getClassSubjects, getSubjectChapters } from "@/lib/api";
import { VISIBLE_SUBJECTS, getSubjectDisplayName, getSubjectColor, getSubjectIcon } from "@/lib/subjects";
import { loadProgress, type LocalProgress, type LocalBadge } from "@/lib/progress";
import { getSubjectCompletedCount } from "@/lib/progress";

// ─── Progress ring SVG ────────────────────────────────────────────────────────
function ProgressRing({
  completed,
  total,
  color,
  label,
  icon,
}: {
  completed: number;
  total: number;
  color: string;
  label: string;
  icon: string;
}) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(completed / total, 1) : 0;
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          {/* Track */}
          <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          {/* Fill */}
          <circle
            cx="28" cy="28" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base">
          {icon}
        </span>
      </div>
      <span className="text-[10px] text-muted font-medium text-center leading-tight max-w-[56px]">{label}</span>
      <span className="text-[10px] tabular-nums font-bold" style={{ color }}>
        {completed}/{total}
      </span>
    </div>
  );
}

// ─── Badge tier colors ────────────────────────────────────────────────────────
const TIER_COLORS: Record<LocalBadge["tier"], { bg: string; border: string; text: string; label: string }> = {
  bronze:  { bg: "rgba(180,83,9,0.12)",  border: "rgba(180,83,9,0.3)",  text: "#d97706", label: "Bronze" },
  silver:  { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)", text: "#94a3b8", label: "Silver" },
  gold:    { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", text: "#fbbf24", label: "Gold" },
  diamond: { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)", text: "#a78bfa", label: "Diamond" },
};

const TIER_ICONS: Record<LocalBadge["tier"], string> = {
  bronze: "🥉", silver: "🥈", gold: "🥇", diamond: "💎",
};

function BadgeChip({ badge }: { badge: LocalBadge }) {
  const t = TIER_COLORS[badge.tier];
  return (
    <div
      className="flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center w-[76px] shrink-0"
      style={{ background: t.bg, borderColor: t.border }}
      title={badge.description}
    >
      <span className="text-xl">{TIER_ICONS[badge.tier]}</span>
      <span className="text-[10px] font-bold leading-tight" style={{ color: t.text }}>{badge.name}</span>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [selectedClass, setSelectedClass] = useState("8");
  const [classData, setClassData] = useState<SyllabusClassesData | null>(null);
  const [subjectChapterCounts, setSubjectChapterCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LocalProgress | null>(null);

  // Set page title
  useEffect(() => { document.title = "Dashboard — Crestline"; }, []);

  // Load local progress on mount
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const loadClassData = useCallback(async (classId: string) => {
    setLoading(true);
    setError(null);
    setClassData(null);
    setSubjectChapterCounts({});
    try {
      const res = await getClassSubjects(classId);
      if (res.success && res.data) {
        setClassData(res.data);
        setCountsLoading(true);
        const counts: Record<string, number> = {};
        const visibleSubjects = (res.data.subjects || []).filter((s: string) => VISIBLE_SUBJECTS.has(s));
        await Promise.all(
          visibleSubjects.map(async (subject: string) => {
            try {
              const chRes = await getSubjectChapters(classId, subject);
              if (chRes.success && chRes.data) counts[subject] = chRes.data.totalChapters;
            } catch {
              counts[subject] = 0;
            }
          })
        );
        setSubjectChapterCounts(counts);
        setCountsLoading(false);
      } else {
        setError("No data returned from server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load class data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClassData(selectedClass);
  }, [selectedClass, loadClassData]);

  const visibleSubjects = classData
    ? (classData.subjects || []).filter((s) => VISIBLE_SUBJECTS.has(s))
    : [];

  const streak = progress?.streak.current ?? 0;
  const points = progress?.points ?? 0;
  const badges = progress?.badges ?? [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">Choose your class and start learning</p>
        </div>
        <ClassSelector selectedClass={selectedClass} onSelect={setSelectedClass} />
      </div>

      {/* ── Streak + Points ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Streak */}
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/10 shrink-0">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-orange-400 tabular-nums leading-none">{streak}</div>
            <div className="text-[11px] text-muted mt-0.5 font-medium">day streak</div>
          </div>
        </div>
        {/* Points */}
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 shrink-0">
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-accent tabular-nums leading-none">{points}</div>
            <div className="text-[11px] text-muted mt-0.5 font-medium">points</div>
          </div>
        </div>
      </div>

      {/* ── Progress Rings ───────────────────────────────────────────── */}
      {!loading && visibleSubjects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Progress</h2>
          <div className="card overflow-x-auto">
            <div className="flex gap-5 py-1 px-1 min-w-min">
              {visibleSubjects.map((subject) => {
                const total = subjectChapterCounts[subject] ?? 0;
                const completed = getSubjectCompletedCount(selectedClass, subject);
                const { primary } = getSubjectColor(subject);
                return (
                  <ProgressRing
                    key={subject}
                    completed={completed}
                    total={countsLoading ? 0 : total}
                    color={primary}
                    label={getSubjectDisplayName(subject)}
                    icon={getSubjectIcon(subject)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Badges ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5" />
          Badges {badges.length > 0 && <span className="text-accent">({badges.length})</span>}
        </h2>
        {badges.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {badges.map((b) => <BadgeChip key={b.id} badge={b} />)}
            </div>
          </div>
        ) : (
          <div className="card border-dashed py-4 flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <p className="text-xs text-muted">Complete guides to earn your first badge!</p>
          </div>
        )}
      </div>

      {/* ── Subjects Grid ────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton type="full" count={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadClassData(selectedClass)} />
      ) : classData ? (
        <section>
          <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            Class {classData.classLevel} Subjects
            {countsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />}
          </h2>
          {visibleSubjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleSubjects.map((subject) => (
                <SubjectCard
                  key={subject}
                  name={subject}
                  classId={selectedClass}
                  totalChapters={subjectChapterCounts[subject] || 0}
                  completedChapters={getSubjectCompletedCount(selectedClass, subject)}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <BookOpen className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-muted text-sm">No subjects found for Class {selectedClass}</p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
