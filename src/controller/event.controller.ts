import { Request, Response } from 'express';
import { EventService, eventService } from '@/service/event.service';
import { ApiResponse } from '@/utils/ApiResponse';
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
  constructor(private service: EventService = eventService) {}

  listEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || '';
    if (!req.user?.id) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const events = await this.service.listEvents(userId);
    res.status(200).json(ApiResponse.success({ events }, 'Events listed'));
  });
}

export const eventController = new EventController();
