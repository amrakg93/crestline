import * as fs from 'fs';
import * as path from 'path';
import type {
  Chapter,
  Tip,
  GuideEntry,
  ChapterContent,
  SyllabuClassResponse,
  ChapterListResponse,
  SearchResult,
} from '../types';

// Types for raw JSON
interface RawChapter {
  no: number;
  name: string;
  topics?: string[];
}

interface RawClassData {
  [className: string]: {
    [subjectName: string]: unknown;
  };
}

interface TipsClassData {
  [subjectName: string]: {
    chapter_tips?: { [chapterKey: string]: Tip[] };
  };
}

interface RawTipsData {
  class_8?: TipsClassData & { subject_tips?: { [subject: string]: Tip[] } };
  class_9?: TipsClassData;
  class_10?: TipsClassData;
}

interface RawSyllabus {
  metadata: {
    board: string;
    source: string;
    academic_year: string;
  };
  classes: RawClassData;
  tips_and_tricks: RawTipsData;
}

let syllabusData: RawSyllabus | null = null;
let chapterContentData: Record<string, ChapterContent> | null = null;

function loadChapterContent(): Record<string, ChapterContent> {
  if (chapterContentData) return chapterContentData;

  const contentPath = path.resolve(__dirname, '../data/chapter-content.json');
  if (!fs.existsSync(contentPath)) {
    console.warn('[SyllabusLoader] chapter-content.json not found — content will be empty');
    chapterContentData = {};
    return chapterContentData;
  }

  const raw = fs.readFileSync(contentPath, 'utf-8');
  chapterContentData = JSON.parse(raw) as Record<string, ChapterContent>;
  console.log(`[SyllabusLoader] Loaded chapter content (${Object.keys(chapterContentData).length} entries)`);
  return chapterContentData;
}

export function loadSyllabus(): RawSyllabus {
  if (syllabusData) return syllabusData;

  const dataPath = path.resolve(__dirname, '../data/icse-syllabus-complete.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Syllabus data file not found at: ${dataPath}`);
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  syllabusData = JSON.parse(raw) as RawSyllabus;
  console.log(`[SyllabusLoader] Loaded syllabus data (${(raw.length / 1024).toFixed(1)} KB)`);
  return syllabusData;
}

export function getSyllabus(): RawSyllabus {
  return loadSyllabus();
}

// Normalize class key: "8" or "9" or "10"
function normalizeClass(classLevel: string): string {
  const cleaned = classLevel.replace(/[^0-9]/g, '');
  if (!['8', '9', '10'].includes(cleaned)) {
    throw new Error(`Invalid class level: ${classLevel}. Must be 8, 9, or 10.`);
  }
  return cleaned;
}

// Get all subjects for a class
export function getClassSyllabus(classLevel: string): SyllabuClassResponse {
  const cls = normalizeClass(classLevel);
  const data = loadSyllabus();
  const classData = data.classes[cls];

  if (!classData) {
    throw new Error(`No data found for class ${cls}.`);
  }

  const subjects = Object.keys(classData);
  let totalChapters = 0;

  for (const subject of subjects) {
    const subjectData = classData[subject] as Record<string, unknown>;
    if (subjectData) {
      if (Array.isArray(subjectData.chapters)) {
        totalChapters += (subjectData.chapters as RawChapter[]).length;
      } else if (subjectData.units && Array.isArray(subjectData.units)) {
        // Class 9
        const units = subjectData.units as Array<{ topics?: string[] }>;
        totalChapters += units.reduce((sum, u) => sum + (u.topics?.length || 0), 0);
      } else if (subjectData.semester_1) {
        // Class 10 math
        const s1 = subjectData.semester_1 as { units?: Array<{ sub_units?: string[] }> };
        const s2 = subjectData.semester_2 as { units?: Array<{ sub_units?: string[] }> };
        const s1Count = s1.units?.reduce((sum, u) => sum + (u.sub_units?.length || 0), 0) || 0;
        const s2Count = s2.units?.reduce((sum, u) => sum + (u.sub_units?.length || 0), 0) || 0;
        totalChapters += s1Count + s2Count;
      } else if (subjectData.history && subjectData.civics) {
        // Class 8 history_civics
        const hist = (subjectData.history as { chapters?: RawChapter[] }).chapters?.length || 0;
        const civ = (subjectData.civics as { chapters?: RawChapter[] }).chapters?.length || 0;
        totalChapters += hist + civ;
      } else if (Array.isArray(subjectData.topics)) {
        totalChapters += (subjectData.topics as RawChapter[]).length;
      } else if (subjectData.language && subjectData.literature) {
        totalChapters += (
          (subjectData.language as { topics?: string[] }).topics?.length || 0
        );
      } else if (Array.isArray(subjectData.modules)) {
        totalChapters += (subjectData.modules as Array<{ sub_topics?: string[] }>).reduce(
          (sum, m) => sum + (m.sub_topics?.length || 1), 0
        );
      }
    }
  }

  return {
    classLevel: cls,
    subjects,
    totalChapters,
    metadata: {
      board: data.metadata.board,
      academicYear: data.metadata.academic_year,
    },
  };
}

// Get chapters for a specific subject in a class
export function getSubjectChapters(classLevel: string, subject: string): ChapterListResponse {
  const cls = normalizeClass(classLevel);
  const data = loadSyllabus();
  const classData = data.classes[cls];

  if (!classData) {
    throw new Error(`No data found for class ${cls}.`);
  }

  const subjectKey = subject.toLowerCase();
  const actualKey = Object.keys(classData).find(
    (k) => k.toLowerCase() === subjectKey
  );

  if (!actualKey) {
    throw new Error(
      `Subject "${subject}" not found in class ${cls}. Available: ${Object.keys(classData).join(', ')}`
    );
  }

  const subjectData = classData[actualKey] as Record<string, unknown>;
  const chapters: Array<{ id: string; no: number; name: string }> = [];

  if (Array.isArray(subjectData.chapters)) {
    for (const ch of subjectData.chapters as RawChapter[]) {
      const id = sanitizeChapterId(`${ch.no}_${ch.name}`);
      chapters.push({ id, no: ch.no, name: ch.name });
    }
  } else if (subjectData.units && Array.isArray(subjectData.units)) {
    // Class 9: flatten units/topics
    let chapterNo = 0;
    for (const unit of subjectData.units as Array<{ name: string; topics: string[] }>) {
      for (const topic of unit.topics) {
        chapterNo++;
        const id = sanitizeChapterId(`${unit.name}_${topic}`);
        chapters.push({ id, no: chapterNo, name: topic });
      }
    }
  } else if (subjectData.semester_1) {
    // Class 10 math: flatten semester units
    let chapterNo = 0;
    const s1 = subjectData.semester_1 as { units?: Array<{ name: string; sub_units: string[] }> };
    const s2 = subjectData.semester_2 as { units?: Array<{ name: string; sub_units: string[] }> };
    const allUnits = [...(s1.units || []), ...(s2.units || [])];
    for (const unit of allUnits) {
      for (const sub of unit.sub_units) {
        chapterNo++;
        const id = sanitizeChapterId(`${unit.name}_${sub}`);
        chapters.push({ id, no: chapterNo, name: sub });
      }
    }
  } else if (subjectData.history && subjectData.civics) {
    // Class 8 history_civics
    const historyChapters = (subjectData.history as { chapters?: RawChapter[] }).chapters || [];
    const civicsChapters = (subjectData.civics as { chapters?: RawChapter[] }).chapters || [];
    for (const ch of historyChapters) {
      const id = sanitizeChapterId(`history_${ch.no}_${ch.name}`);
      chapters.push({ id, no: ch.no, name: `[History] ${ch.name}` });
    }
    for (const ch of civicsChapters) {
      const id = sanitizeChapterId(`civics_${ch.no}_${ch.name}`);
      chapters.push({ id, no: ch.no, name: `[Civics] ${ch.name}` });
    }
  } else if (Array.isArray(subjectData.topics)) {
    for (const t of subjectData.topics as RawChapter[]) {
      const id = sanitizeChapterId(`${t.no}_${t.name}`);
      chapters.push({ id, no: t.no, name: t.name });
    }
  } else if (subjectData.language) {
    const langTopics = (subjectData.language as { topics?: string[] }).topics || [];
    for (let i = 0; i < langTopics.length; i++) {
      const id = sanitizeChapterId(`lang_${i + 1}_${langTopics[i]}`);
      chapters.push({ id, no: i + 1, name: langTopics[i] });
    }
  } else if (Array.isArray(subjectData.modules)) {
    const modules = subjectData.modules as Array<{ name: string; semester: number; sub_topics?: string[] }>;
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      if (m.sub_topics && m.sub_topics.length > 0) {
        for (let j = 0; j < m.sub_topics.length; j++) {
          const id = sanitizeChapterId(`${m.name}_${m.sub_topics[j]}`);
          chapters.push({ id, no: i * 100 + j + 1, name: `${m.name}: ${m.sub_topics[j]}` });
        }
      } else {
        const id = sanitizeChapterId(m.name);
        chapters.push({ id, no: i + 1, name: m.name });
      }
    }
  }

  return {
    classLevel: cls,
    subject: actualKey,
    chapters,
  };
}

// Get a guide with tips for a specific chapter
export function getGuide(
  classLevel: string,
  subject: string,
  chapterId: string
): GuideEntry {
  const cls = normalizeClass(classLevel);
  const data = loadSyllabus();
  const tips = getTipsForChapter(cls, subject, chapterId);
  const classData = data.classes[cls];

  if (!classData) {
    throw new Error(`No data found for class ${cls}.`);
  }

  const subjectKey = Object.keys(classData).find(
    (k) => k.toLowerCase() === subject.toLowerCase()
  );

  if (!subjectKey) {
    throw new Error(`Subject "${subject}" not found in class ${cls}.`);
  }

  // Find chapter name from chapter list
  const chapterList = getSubjectChapters(classLevel, subject);
  const chapterInfo = chapterList.chapters.find((c) => c.id === chapterId);

  if (!chapterInfo) {
    throw new Error(
      `Chapter "${chapterId}" not found in ${subject} class ${cls}. Available: ${chapterList.chapters.map((c) => c.id).join(', ')}`
    );
  }

  // Get topics for class 10 chapters
  let topics: string[] | undefined;
  const subjectData = classData[subjectKey] as Record<string, unknown>;
  if (Array.isArray(subjectData.chapters)) {
    const ch = (subjectData.chapters as RawChapter[]).find(
      (c) => sanitizeChapterId(`${c.no}_${c.name}`) === chapterId
    );
    if (ch?.topics) topics = ch.topics;
  }

  // Look up chapter content
  const contentMap = loadChapterContent();
  const contentKey = `${cls}|${subjectKey}|${chapterId}`;
  const content = contentMap[contentKey];

  return {
    chapterNo: chapterInfo.no,
    chapterName: chapterInfo.name,
    subject: subjectKey,
    classLevel: cls,
    tips,
    topics,
    content,
  };
}

// Get tips for a chapter
export function getTips(
  classLevel: string,
  subject: string,
  chapterId: string
): Tip[] {
  const cls = normalizeClass(classLevel);
  return getTipsForChapter(cls, subject, chapterId);
}

// Search across all guides
export function searchGuides(query: string, classFilter?: string, subjectFilter?: string): SearchResult[] {
  const data = loadSyllabus();
  const results: SearchResult[] = [];
  const q = query.toLowerCase().trim();

  if (!q) return results;

  for (const cls of ['8', '9', '10']) {
    if (classFilter && cls !== normalizeClass(classFilter)) continue;

    const classData = data.classes[cls];
    if (!classData) continue;

    for (const subjectKey of Object.keys(classData)) {
      if (subjectFilter && subjectKey.toLowerCase() !== subjectFilter.toLowerCase()) continue;

      const chapters = getSubjectChapters(cls, subjectKey);
      for (const chapter of chapters.chapters) {
        let relevance = 0;

        // Exact match on chapter name
        if (chapter.name.toLowerCase() === q) {
          relevance = 100;
        }
        // Starts with
        else if (chapter.name.toLowerCase().startsWith(q)) {
          relevance = 80;
        }
        // Contains query
        else if (chapter.name.toLowerCase().includes(q)) {
          relevance = 60;
        }
        // Contains words from query
        else {
          const queryWords = q.split(/\s+/);
          const nameWords = chapter.name.toLowerCase().split(/\s+/);
          const matchCount = queryWords.filter((qw) =>
            nameWords.some((nw) => nw.includes(qw))
          ).length;
          if (matchCount > 0) {
            relevance = matchCount * 20;
          }
        }

        // Search in tips too
        const tips = getTipsForChapter(cls, subjectKey, chapter.id);
        if (relevance === 0 && tips.length > 0) {
          for (const tip of tips) {
            if (tip.title.toLowerCase().includes(q) || tip.trick.toLowerCase().includes(q)) {
              relevance = 40;
              break;
            }
          }
        }

        if (relevance > 0) {
          results.push({
            classLevel: cls,
            subject: subjectKey,
            chapterId: chapter.id,
            chapterName: chapter.name,
            relevance,
          });
        }
      }
    }
  }

  // Sort by relevance descending
  results.sort((a, b) => b.relevance - a.relevance);

  return results;
}

// --- Internal Helpers ---

function sanitizeChapterId(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function getTipsForChapter(cls: string, subject: string, chapterId: string): Tip[] {
  const data = loadSyllabus();
  const tipsData = data.tips_and_tricks;
  if (!tipsData) return [];

  const classKey = `class_${cls}` as keyof RawTipsData;
  const classTips = tipsData[classKey];
  if (!classTips) return [];

  const subjectKey = Object.keys(classTips).find(
    (k) => k.toLowerCase() === subject.toLowerCase()
  );
  if (!subjectKey) return [];

  // Try chapter_tips (keyed by chapter identifier)
  const subjectTips = classTips[subjectKey] as {
    chapter_tips?: { [key: string]: Tip[] };
    subject_tips?: { [subj: string]: Tip[] };
  };

  if (subjectTips.chapter_tips) {
    // Try exact match
    if (subjectTips.chapter_tips[chapterId]) {
      return subjectTips.chapter_tips[chapterId];
    }
    // Try fuzzy match with multiple strategies
    for (const [key, tips] of Object.entries(subjectTips.chapter_tips)) {
      const keyLower = key.toLowerCase();
      const idLower = chapterId.toLowerCase();

      // Strategy 1: substring match (one contains the other)
      if (keyLower.includes(idLower) || idLower.includes(keyLower)) {
        return tips;
      }

      // Strategy 2: word-level overlap -- split both by underscores
      const keyWords = keyLower.split('_').filter((w) => w.length > 1);
      const idWords = idLower.split('_').filter((w) => w.length > 1);

      if (keyWords.length > 0 && idWords.length > 0) {
        const matchCount = keyWords.filter((kw) =>
          idWords.some((iw) => iw === kw || iw.includes(kw) || kw.includes(iw))
        ).length;
        // If more than 60% of key words match, consider it a match
        if (matchCount / keyWords.length >= 0.6) {
          return tips;
        }
      }

      // Strategy 3: normalized exact match
      const normalizedKey = sanitizeChapterId(key);
      if (normalizedKey.toLowerCase() === chapterId.toLowerCase()) {
        return tips;
      }
    }
  }

  return [];
}

