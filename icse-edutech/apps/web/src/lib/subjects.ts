// Display name and icon mappings for subjects

// The 5 subjects shown in the main UI (History/Civics and Geography are hidden)
export const VISIBLE_SUBJECTS = new Set([
  "mathematics",
  "physics",
  "chemistry",
  "biology",
  "english",
]);

export const SUBJECT_DISPLAY_NAMES: Record<string, string> = {
  mathematics: "Mathematics",
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  english: "English",
  history_civics: "History & Civics",
  geography: "Geography",
};

export const SUBJECT_ICONS: Record<string, string> = {
  mathematics: "📐",
  physics: "⚡",
  chemistry: "🧪",
  biology: "🧬",
  english: "📖",
  history_civics: "🏛️",
  geography: "🌍",
};

export function getSubjectDisplayName(key: string): string {
  return (
    SUBJECT_DISPLAY_NAMES[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function getSubjectIcon(key: string): string {
  return SUBJECT_ICONS[key] || "📚";
}

const SUBJECT_COLORS: Record<string, { primary: string; bg: string }> = {
  mathematics:    { primary: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  physics:        { primary: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  chemistry:      { primary: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  biology:        { primary: "#34d399", bg: "rgba(52,211,153,0.12)" },
  english:        { primary: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  history_civics: { primary: "#fb923c", bg: "rgba(249,115,22,0.12)" },
  geography:      { primary: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
};

export function getSubjectColor(key: string): { primary: string; bg: string } {
  return SUBJECT_COLORS[key] || { primary: "#22d3ee", bg: "rgba(34,211,238,0.12)" };
}
