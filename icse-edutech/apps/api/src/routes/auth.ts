import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendOtp, verifyOtp, getUserById } from '../services/authService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number too long')
    .regex(/^[\d\s+\-]+$/, 'Phone number must contain only digits, spaces, +, or -'),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

// POST /api/auth/send-otp
// Sends OTP to phone (mock in development)
router.post('/auth/send-otp', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    const result = sendOtp(phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp
// Verifies OTP and returns JWT token
router.post('/auth/verify-otp', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);
    const { token, user } = verifyOtp(phone, otp);
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
// Returns current user from JWT (protected)
router.get('/auth/me', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
