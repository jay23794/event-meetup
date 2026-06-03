import mongoose from 'mongoose';
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  UnprocessableEntityError,
} from './index';
import { AppError } from './app.errors';

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

const isMongoServerError = (error: unknown): error is MongoServerError =>
  error instanceof Error &&
  (error.name === 'MongoServerError' || error.name === 'MongoError') &&
  typeof (error as MongoServerError).code === 'number';

export const handleMongooseError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.entries(error.errors).map(([path, err]) => ({
      path,
      message: err.message,
    }));
    return new UnprocessableEntityError('Validation failed', details);
  }

  if (error instanceof mongoose.Error.CastError) {
    return new BadRequestError(`Invalid value for field '${error.path}'`, {
      path: error.path,
      value: error.value,
    });
  }

  if (isMongoServerError(error) && error.code === 11000) {
    return new ConflictError('Duplicate key', { keyValue: error.keyValue });
  }

  if (error instanceof mongoose.Error) {
    return new InternalServerError(error.message);
  }

  const message = error instanceof Error ? error.message : 'Database error';
  return new InternalServerError(message);
};
