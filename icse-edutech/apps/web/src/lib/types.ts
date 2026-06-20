// Types matching the ICSE Edutech backend response shapes EXACTLY

// --- Syllabus API ---

export interface SyllabusClassesData {
  classLevel: string; // "8", "9", or "10"
  subjects: string[]; // ["mathematics", "physics", "chemistry", "biology", "english", "history_civics", "geography"]
  totalChapters: number;
  metadata: Record<string, unknown>;
}

export interface SubjectChaptersData {
  classLevel: string;
  subject: string;
  chapters: Chapter[];
  totalChapters: number;
}

export interface Chapter {
  id: string; // e.g. "1_Rational_Numbers"
  no: number;
  name: string; // e.g. "Rational Numbers"
}

// --- Guide API ---

export interface KeyConcept {
  term: string;
  definition: string;
}

export interface LawOrFormula {
  name: string;
  formula?: string;
  statement?: string;
}

export interface GuideData {
  classLevel: string;
  subject: string;
  chapterId: string;
  chapter: Chapter;
  tips: GuideTip[];
  overview?: string;
  key_concepts?: KeyConcept[];
  laws_and_formulas?: LawOrFormula[];
  key_points?: string[];
}

export interface GuideTip {
  title: string;
  trick: string;
  time_saved: string; // e.g. "5 min"
}

// --- Tips API ---

export interface TipsData {
  classLevel: string;
  subject: string;
  chapterId: string;
  tips: GuideTip[];
  count: number;
}

// --- Graph Engine (port 4001) ---

export interface WalkthroughTarget {
  id: string;
  class: string;
  subject: string;
  chapterName: string;
}

export interface WalkthroughGuide {
  id: string;
  class: string;
  subject: string;
  chapterName: string;
}

export interface WalkthroughLevel {
  level: number;
  guides: WalkthroughGuide[];
}

export interface WalkthroughData {
  target: WalkthroughTarget;
  levels: WalkthroughLevel[];
}

// --- Generic API response wrapper ---

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
