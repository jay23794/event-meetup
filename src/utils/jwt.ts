import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
}
