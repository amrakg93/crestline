import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getProgress, updateProgress } from '../services/progressService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const progressUpdateSchema = z.object({
  classLevel: z.enum(['8', '9', '10'], {
    errorMap: () => ({ message: 'classLevel must be 8, 9, or 10' }),
  }),
  subject: z.string().min(1, 'Subject is required'),
  chapterId: z.string().min(1, 'Chapter ID is required'),
});

// GET /api/progress/:userId
// Returns progress for a user (protected - user can only view their own)
router.get('/progress/:userId', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = userIdParamSchema.parse(req.params);

    // Users can only view their own progress
    if (req.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only view your own progress.',
      });
      return;
    }

    const progress = getProgress(userId);
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
});

// POST /api/progress/:userId
// Updates progress (mark guide complete) (protected)
router.post('/progress/:userId', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = userIdParamSchema.parse(req.params);

    // Users can only update their own progress
    if (req.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own progress.',
      });
      return;
    }

    const update = progressUpdateSchema.parse(req.body);
    const progress = updateProgress(userId, update);

    res.json({
      success: true,
      data: progress,
      message: `Marked ${update.subject} chapter "${update.chapterId}" as completed.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
