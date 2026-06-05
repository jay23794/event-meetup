import { Request, Response } from 'express';

import { ApiError } from '@/errors/ApiError';
import { successResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { eventService } from '@/infra/container';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}


  export const listEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();
    const events = await eventService.listEvents(userId);
    res.status(200).json(successResponse({ events }, 'Events listed'));
  });



