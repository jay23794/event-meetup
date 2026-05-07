import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import { ApiError } from '@/shared/utils/ApiError';
import { RequestUser } from '@/shared/types/common.types';

interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};
