import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '@/errors/ApiError';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof Error) {
        next(ApiError.badRequest('Validation failed', error.message));
      } else {
        next(ApiError.badRequest('Validation failed'));
      }
    }
  };
};
