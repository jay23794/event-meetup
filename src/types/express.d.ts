import { RequestUser } from '@/types/common.types';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      requestId?: string;
    }
  }
}
