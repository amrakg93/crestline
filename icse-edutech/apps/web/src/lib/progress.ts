// Client-side progress store — persisted in localStorage
// Used for streak, badges, and per-subject completion rings

export type BadgeTier = "bronze" | "silver" | "gold" | "diamond";

export interface LocalBadge {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  earnedAt: number;
}

export interface LocalProgress {
  completedGuides: string[]; // "class:subject:chapterId"
  streak: { current: number; longest: number; lastActivityDate: string };
  badges: LocalBadge[];
  points: number;
}

const STORAGE_KEY = "crestline_progress_v1";

function defaultProgress(): LocalProgress {
  return {
    completedGuides: [],
    streak: { current: 0, longest: 0, lastActivityDate: "" },
    badges: [],
    points: 0,
  };
}

export function loadProgress(): LocalProgress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalProgress) : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function saveProgress(p: LocalProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function updateStreak(p: LocalProgress): void {
  const today = new Date().toISOString().slice(0, 10);
  const last = p.streak.lastActivityDate;
  if (last === today) return;
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  p.streak.current = last === yesterday ? p.streak.current + 1 : 1;
  p.streak.longest = Math.max(p.streak.longest, p.streak.current);
  p.streak.lastActivityDate = today;
}

// 12 badge definitions
const BADGE_DEFS: Array<{
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  check: (p: LocalProgress) => boolean;
}> = [
  { id: "first_step", name: "First Step", description: "Complete your first guide", tier: "bronze",
    check: (p) => p.completedGuides.length >= 1 },
  { id: "on_a_roll", name: "On a Roll", description: "Complete 5 guides", tier: "bronze",
    check: (p) => p.completedGuides.length >= 5 },
  { id: "point_collector", name: "Point Collector", description: "Earn 50 points", tier: "bronze",
    check: (p) => p.points >= 50 },
  { id: "getting_serious", name: "Getting Serious", description: "Complete 10 guides", tier: "silver",
    check: (p) => p.completedGuides.length >= 10 },
  { id: "week_warrior", name: "Week Warrior", description: "7-day study streak", tier: "silver",
    check: (p) => p.streak.longest >= 7 },
  { id: "chapter_master", name: "Chapter Master", description: "Complete 25 guides", tier: "silver",
    check: (p) => p.completedGuides.length >= 25 },
  { id: "math_wizard", name: "Math Wizard", description: "Complete 10 Maths guides", tier: "gold",
    check: (p) => p.completedGuides.filter((g) => g.includes(":mathematics:")).length >= 10 },
  { id: "science_star", name: "Science Star", description: "Complete a guide in all 3 sciences", tier: "gold",
    check: (p) => ["physics", "chemistry", "biology"].every((s) => p.completedGuides.some((g) => g.includes(`:${s}:`))) },
  { id: "fortnight_flame", name: "Fortnight Flame", description: "14-day study streak", tier: "gold",
    check: (p) => p.streak.longest >= 14 },
  { id: "scholar", name: "Scholar", description: "Complete 50 guides", tier: "gold",
    check: (p) => p.completedGuides.length >= 50 },
  { id: "grand_master", name: "Grand Master", description: "Complete 100 guides", tier: "diamond",
    check: (p) => p.completedGuides.length >= 100 },
  { id: "month_marathoner", name: "Month Marathoner", description: "30-day study streak", tier: "diamond",
    check: (p) => p.streak.longest >= 30 },
];

function checkBadges(p: LocalProgress): void {
  const earned = new Set(p.badges.map((b) => b.id));
  for (const def of BADGE_DEFS) {
    if (!earned.has(def.id) && def.check(p)) {
      p.badges.push({
        id: def.id, name: def.name, description: def.description,
        tier: def.tier, earnedAt: Date.now(),
      });
    }
  }
}

export function markGuideComplete(classId: string, subject: string, chapterId: string): LocalProgress {
  const p = loadProgress();
  const key = `${classId}:${subject}:${chapterId}`;
  if (!p.completedGuides.includes(key)) {
    p.completedGuides.push(key);
    p.points += 10;
    updateStreak(p);
    checkBadges(p);
    saveProgress(p);
  }
  return p;
}

export function isGuideComplete(classId: string, subject: string, chapterId: string): boolean {
  const p = loadProgress();
  return p.completedGuides.includes(`${classId}:${subject}:${chapterId}`);
}

export function getSubjectCompletedCount(classId: string, subject: string): number {
  const p = loadProgress();
  return p.completedGuides.filter((g) => g.startsWith(`${classId}:${subject}:`)).length;
}

export { BADGE_DEFS };
