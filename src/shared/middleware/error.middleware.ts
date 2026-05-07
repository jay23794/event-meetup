import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/shared/utils/ApiError';
import { logger } from '@/config/logger';
import { ApiResponse } from '@/shared/utils/ApiResponse';

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof ApiError) {
    logger.error(
      { statusCode: error.statusCode, details: error.details },
      error.message
    );
    res
      .status(error.statusCode)
      .json(
        ApiResponse.error(error.message)
      );
    return;
  }

  if (error instanceof Error) {
    logger.error(error, 'Unexpected error');
    res
      .status(500)
      .json(ApiResponse.error('Internal Server Error'));
    return;
  }

  logger.error(error, 'Unknown error');
  res
    .status(500)
    .json(ApiResponse.error('Internal Server Error'));
};
