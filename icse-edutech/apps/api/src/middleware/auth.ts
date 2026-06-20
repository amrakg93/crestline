import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById } from '../services/authService';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      phone?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a Bearer token.',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization header format. Use: Bearer <token>',
    });
    return;
  }

  const token = parts[1];

  try {
    const payload = verifyToken(token);
    const user = getUserById(payload.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found. Token may be invalid.',
      });
      return;
    }

    req.userId = payload.userId;
    req.phone = payload.phone;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    res.status(401).json({
      success: false,
      error: `Authentication failed: ${message}`,
    });
  }
}
