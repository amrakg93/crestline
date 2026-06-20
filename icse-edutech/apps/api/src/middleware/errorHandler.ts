import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError | ZodError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Known application errors
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log server errors
  if (statusCode >= 500) {
    console.error(`[Error] ${statusCode}: ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? 'Internal server error' : message,
  });
}

// 404 handler for unknown routes
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
}
