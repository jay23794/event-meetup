import { ZodError } from 'zod';
import { AppError } from './app.errors';

export interface ZodIssue {
  path: string;
  message: string;
}

export class ZodValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly issues: ZodIssue[];

  constructor(error: ZodError, message = 'Validation failed') {
    super(message);
    this.issues = error.errors.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  }
}
