import type { Progress, ProgressUpdate, Badge, BadgeTier } from '../types';

// In-memory progress store: userId -> Progress
const progressStore = new Map<string, Progress>();

const STREAK_GRACE_PERIOD_HOURS = 36; // Can miss a day and still keep streak

// Badge definitions
const BADGE_DEFINITIONS: Array<{ threshold: number; name: string; description: string; tier: BadgeTier }> = [
  { threshold: 1, name: 'First Step', description: 'Complete your first chapter guide', tier: 'bronze' },
  { threshold: 5, name: 'Quick Learner', description: 'Complete 5 chapter guides', tier: 'bronze' },
  { threshold: 10, name: 'Knowledge Seeker', description: 'Complete 10 chapter guides', tier: 'silver' },
  { threshold: 25, name: 'Scholar', description: 'Complete 25 chapter guides', tier: 'silver' },
  { threshold: 50, name: 'Master', description: 'Complete 50 chapter guides', tier: 'gold' },
  { threshold: 100, name: 'Grandmaster', description: 'Complete 100 chapter guides', tier: 'gold' },
  { threshold: 200, name: 'Legend', description: 'Complete 200 chapter guides', tier: 'diamond' },
];

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getOrCreateProgress(userId: string): Progress {
  let progress = progressStore.get(userId);
  if (!progress) {
    progress = {
      userId,
      completedGuides: [],
      streak: {
        current: 0,
        longest: 0,
        lastActivityDate: '',
      },
      badges: [],
      totalCompleted: 0,
      points: 0,
    };
    progressStore.set(userId, progress);
  }
  return progress;
}

function updateStreak(progress: Progress): void {
  const today = getTodayISO();
  const yesterday = getYesterdayISO();

  if (progress.streak.lastActivityDate === today) {
    // Already logged activity today, streak unchanged
    return;
  }

  if (progress.streak.lastActivityDate === yesterday) {
    // Consecutive day
    progress.streak.current += 1;
  } else if (!progress.streak.lastActivityDate) {
    // First ever activity
    progress.streak.current = 1;
  } else {
    // Streak broken - check if within grace period
    const lastDate = new Date(progress.streak.lastActivityDate);
    const hoursSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
    if (hoursSince <= STREAK_GRACE_PERIOD_HOURS) {
      // Still within grace period, keep streak
      progress.streak.current += 1;
    } else {
      // Streak broken
      progress.streak.current = 1;
    }
  }

  progress.streak.lastActivityDate = today;

  if (progress.streak.current > progress.streak.longest) {
    progress.streak.longest = progress.streak.current;
  }
}

function calculatePoints(progress: Progress): void {
  // 10 points per chapter, +5 bonus for streak days (capped at 3x per streak)
  const streakBonus = Math.min(progress.streak.current, 30) * 5;
  progress.points = progress.totalCompleted * 10 + streakBonus;
}

function checkBadges(progress: Progress): void {
  const existingBadgeIds = new Set(progress.badges.map((b) => b.id));

  for (const def of BADGE_DEFINITIONS) {
    if (progress.totalCompleted >= def.threshold && !existingBadgeIds.has(def.name)) {
      progress.badges.push({
        id: def.name,
        name: def.name,
        description: def.description,
        tier: def.tier,
        earnedAt: Date.now(),
      });
    }
  }
}

export function getProgress(userId: string): Progress {
  return getOrCreateProgress(userId);
}

export function updateProgress(userId: string, update: ProgressUpdate): Progress {
  const progress = getOrCreateProgress(userId);

  const guideKey = `${update.classLevel}:${update.subject}:${update.chapterId}`;

  if (progress.completedGuides.includes(guideKey)) {
    // Already completed, just return current state
    return progress;
  }

  progress.completedGuides.push(guideKey);
  progress.totalCompleted = progress.completedGuides.length;

  updateStreak(progress);
  calculatePoints(progress);
  checkBadges(progress);

  return progress;
}

export function getAllProgress(): Map<string, Progress> {
  return progressStore;
}
