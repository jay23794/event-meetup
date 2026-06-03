import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app.errors';
import { ZodValidationError } from './zod.error';
import { ApiError } from './ApiError';
import { logger } from '@/infra/logger';
import { ApiResponse } from '@/utils/ApiResponse';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof ZodError) {
    const wrapped = new ZodValidationError(error);
    logger.warn({ issues: wrapped.issues }, wrapped.message);
    res.status(wrapped.statusCode).json({
      success: false,
      message: wrapped.message,
      issues: wrapped.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    logger.error(
      { statusCode: error.statusCode, name: error.name, details: error.details },
      error.message
    );
    res.status(error.statusCode).json(ApiResponse.error(error.message));
    return;
  }

  // Legacy ApiError thrown from existing feature code (kept until features migrate to AppError subclasses).
  if (error instanceof ApiError) {
    logger.error(
      { statusCode: error.statusCode, details: error.details },
      error.message
    );
    res.status(error.statusCode).json(ApiResponse.error(error.message));
    return;
  }

  if (error instanceof Error) {
    logger.error(error, 'Unexpected error');
    res.status(500).json(ApiResponse.error('Internal Server Error'));
    return;
  }

  logger.error(error, 'Unknown error');
  res.status(500).json(ApiResponse.error('Internal Server Error'));
};
