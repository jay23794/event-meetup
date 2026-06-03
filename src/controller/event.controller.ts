import { Request, Response } from 'express';
import { eventService } from '@/service/event.service';
import { ApiError } from '@/errors/ApiError';
import { successResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

export class EventController {
  listEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();
    const events = await eventService.listEvents(userId);
    res.status(200).json(successResponse({ events }, 'Events listed'));
  });
}

export const eventController = new EventController();
