import { AppError } from './app.errors';

export { AppError } from './app.errors';
export { ZodValidationError, type ZodIssue } from './zod.error';

export class BadRequestError extends AppError {
  public readonly statusCode = 400;
  constructor(message = 'Bad Request', details?: unknown) {
    super(message, details);
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, details);
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, details);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  constructor(message = 'Not Found', details?: unknown) {
    super(message, details);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  constructor(message = 'Conflict', details?: unknown) {
    super(message, details);
  }
}

export class PreconditionFailedError extends AppError {
  public readonly statusCode = 412;
  constructor(message = 'Precondition Failed', details?: unknown) {
    super(message, details);
  }
}

export class UnprocessableEntityError extends AppError {
  public readonly statusCode = 422;
  constructor(message = 'Unprocessable Entity', details?: unknown) {
    super(message, details);
  }
}

export class TooManyRequestsError extends AppError {
  public readonly statusCode = 429;
  constructor(message = 'Too Many Requests', details?: unknown) {
    super(message, details);
  }
}

export class InternalServerError extends AppError {
  public readonly statusCode = 500;
  constructor(message = 'Internal Server Error', details?: unknown) {
    super(message, details);
  }
}

export class BadGatewayError extends AppError {
  public readonly statusCode = 502;
  constructor(message = 'Bad Gateway', details?: unknown) {
    super(message, details);
  }
}

export class ServiceUnavailableError extends AppError {
  public readonly statusCode = 503;
  constructor(message = 'Service Unavailable', details?: unknown) {
    super(message, details);
  }
}
