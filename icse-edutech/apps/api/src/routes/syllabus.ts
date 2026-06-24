import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import {
  getClassSyllabus,
  getSubjectChapters,
  getGuide,
  getTips as getTipsService,
  searchGuides,
  loadSyllabus,
} from '../services/syllabusLoader';

const router = Router();

// Load syllabus data at startup (ensure it's ready)
loadSyllabus();

// Load chapter examples (worked examples + diagrams)
const examplesPath = path.join(__dirname, '../data/chapter-examples.json');
const chapterExamples: Record<string, { worked_examples: unknown[]; diagrams: unknown[] }> =
  fs.existsSync(examplesPath) ? JSON.parse(fs.readFileSync(examplesPath, 'utf-8')) : {};

// Validation schemas
const classParamSchema = z.object({
  class: z.enum(['8', '9', '10']),
});

const subjectParamSchema = z.object({
  class: z.enum(['8', '9', '10']),
  subject: z.string().min(1),
});

const chapterParamSchema = z.object({
  class: z.enum(['8', '9', '10']),
  subject: z.string().min(1),
  chapterId: z.string().min(1),
});

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  class: z.enum(['8', '9', '10']).optional(),
  subject: z.string().optional(),
});

// GET /api/syllabus/:class
// Returns all subjects & chapters for a class
router.get('/syllabus/:class', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { class: classLevel } = classParamSchema.parse(req.params);
    const result = getClassSyllabus(classLevel);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/syllabus/:class/:subject
// Returns chapter list for a subject
router.get('/syllabus/:class/:subject', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { class: classLevel, subject } = subjectParamSchema.parse(req.params);
    const result = getSubjectChapters(classLevel, subject);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/guide/:class/:subject/:chapterId
// Returns a single guide with tips
router.get('/guide/:class/:subject/:chapterId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { class: classLevel, subject, chapterId } = chapterParamSchema.parse(req.params);
    const guide = getGuide(classLevel, subject, chapterId);
    // Reshape to match frontend GuideData: { chapter: { no, name }, ... }
    res.json({
      success: true,
      data: {
        classLevel: guide.classLevel,
        subject: guide.subject,
        chapterId,
        chapter: { no: guide.chapterNo, name: guide.chapterName },
        tips: guide.tips,
        overview: guide.content?.overview,
        key_concepts: guide.content?.key_concepts,
        laws_and_formulas: guide.content?.laws_and_formulas,
        key_points: guide.content?.key_points,
        ...(chapterExamples[`${classLevel}|${subject}|${chapterId}`] ?? {}),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tips/:class/:subject/:chapterId
// Returns tips & tricks for a chapter
router.get('/tips/:class/:subject/:chapterId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { class: classLevel, subject, chapterId } = chapterParamSchema.parse(req.params);
    const tips = getTipsService(classLevel, subject, chapterId);
    res.json({
      success: true,
      data: {
        classLevel,
        subject,
        chapterId,
        tips,
        count: tips.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/search
// Full-text search across guides
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, class: classFilter, subject: subjectFilter } = searchQuerySchema.parse(req.query);
    const results = searchGuides(q, classFilter, subjectFilter);
    res.json({
      success: true,
      data: {
        query: q,
        results,
        total: results.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
