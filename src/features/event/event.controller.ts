import { Request, Response } from 'express';
import { EventService } from './event.service';
import { ApiResponse } from '@/shared/utils/ApiResponse';
import { asyncHandler } from '@/shared/utils/asyncHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

export class EventController {
  private service: EventService;

  constructor() {
    this.service = new EventService();
  }

  getEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id?: string };
    const userId = req.user?.id || '';
    if (!req.user?.id || !id) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const event = await this.service.getEvent(id, userId);
    res.status(200).json(ApiResponse.success({ event }, 'Event retrieved'));
  });

  listEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || '';
    if (!req.user?.id) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const events = await this.service.listEvents(userId);
    res.status(200).json(ApiResponse.success({ events }, 'Events listed'));
  });

  createEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || '';
    if (!req.user?.id) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const event = await this.service.createEvent(userId, req.body);
    res.status(201).json(ApiResponse.success({ event }, 'Event created'));
  });

  updateEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id?: string };
    const userId = req.user?.id || '';
    if (!req.user?.id || !id) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const event = await this.service.updateEvent(id, userId, req.body);
    res.status(200).json(ApiResponse.success({ event }, 'Event updated'));
  });

  deleteEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id?: string };
    const userId = req.user?.id || '';
    if (!req.user?.id || !id) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    await this.service.deleteEvent(id, userId);
    res.status(200).json(ApiResponse.success(null, 'Event deleted'));
  });

  getSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventId } = req.params as { eventId?: string };
    const userId = req.user?.id || '';
    if (!req.user?.id || !eventId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const summary = await this.service.getSummary(eventId, userId);
    res.status(200).json(ApiResponse.success(summary, 'Event summary retrieved'));
  });
}
