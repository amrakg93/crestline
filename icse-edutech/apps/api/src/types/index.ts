// ============================================================
// ICSE Edutech API — TypeScript Type Definitions
// ============================================================

// --- Syllabus / Content Types ---

export interface Chapter {
  no: number;
  name: string;
}

export interface Tip {
  title: string;
  trick: string;
  time_saved?: string;
  chapter?: string;
}

export interface ChapterTips {
  [chapterKey: string]: Tip[];
}

export interface SubjectTips {
  [subjectName: string]: Tip[];
}

export interface GuideEntry {
  chapterNo: number;
  chapterName: string;
  subject: string;
  classLevel: string;
  tips: Tip[];
  topics?: string[];
  content?: ChapterContent;
}

// Class 8 chapters are stored under subject.chapters[]
export interface Class8Subject {
  chapters: Chapter[];
}

// Class 8 English uses topics[] instead of chapters[]
export interface Class8English {
  topics: Chapter[];
}

// Class 8 History/Civics has sub-objects
export interface Class8HistoryCivics {
  history: { chapters: Chapter[] };
  civics: { chapters: Chapter[] };
}

// Class 9 units-based structure
export interface Class9Unit {
  name: string;
  topics: string[];
}

export interface Class9Subject {
  total_marks: number;
  theory_marks: number;
  internal_marks: number;
  units: Class9Unit[];
}

// Class 10 semester-based structure
export interface Class10SemesterUnit {
  name: string;
  sub_units: string[];
}

export interface Class10Semester {
  marks: number;
  units: Class10SemesterUnit[];
}

export interface Class10Math {
  semester_1: Class10Semester;
  semester_2: Class10Semester;
  exam_pattern: string;
  total_marks: number;
  theory_marks: number;
  internal_marks: number;
}

export interface Class10ChapterWithTopics {
  no: number;
  name: string;
  topics?: string[];
}

// Union type for any class subject data
export type ClassSubjectData =
  | Class8Subject
  | Class8English
  | Class8HistoryCivics
  | Class9Subject
  | Class10Math
  | { chapters: Chapter[] }
  | { chapters: Class10ChapterWithTopics[] }
  | { modules: Array<{ name: string; semester: number; sub_topics?: string[] }> };

// --- Auth / User Types ---

export interface User {
  id: string;
  phone: string;
  name: string;
  createdAt: number;
}

export interface OtpRecord {
  phone: string;
  otp: string;
  expiresAt: number;
  verified: boolean;
}

export interface JwtPayload {
  userId: string;
  phone: string;
  iat?: number;
  exp?: number;
}

// --- Progress Types ---

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  earnedAt: number;
}

export interface Progress {
  userId: string;
  completedGuides: string[]; // Array of "class:subject:chapterId"
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string; // ISO date string
  };
  badges: Badge[];
  totalCompleted: number;
  points: number;
}

export interface ProgressUpdate {
  classLevel: string;
  subject: string;
  chapterId: string;
}

// --- Response Types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyllabuSubject {
  name: string;
  chapterCount: number;
}

export interface SyllabuClassResponse {
  classLevel: string;
  subjects: string[];
  totalChapters: number;
  metadata: {
    board: string;
    academicYear: string;
  };
}

export interface ChapterListResponse {
  classLevel: string;
  subject: string;
  chapters: Array<{ id: string; no: number; name: string }>;
}

export interface KeyConcept {
  term: string;
  definition: string;
}

export interface LawOrFormula {
  name: string;
  formula?: string;
  statement?: string;
}

export interface ChapterContent {
  overview: string;
  key_concepts: KeyConcept[];
  laws_and_formulas?: LawOrFormula[];
  key_points: string[];
}

export interface GuideResponse {
  classLevel: string;
  subject: string;
  chapterId: string;
  chapterName: string;
  tips: Tip[];
  topics?: string[];
  content?: ChapterContent;
}

export interface TipsResponse {
  classLevel: string;
  subject: string;
  chapterId: string;
  tips: Tip[];
  count: number;
}

export interface SearchResult {
  classLevel: string;
  subject: string;
  chapterId: string;
  chapterName: string;
  relevance: number;
}
