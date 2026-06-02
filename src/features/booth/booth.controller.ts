import { Request, Response } from 'express';
import { BoothService } from './booth.service';
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

export class BoothController {
  private service: BoothService;

  constructor() {
    this.service = new BoothService();
  }

  createBooth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventId } = req.params as { eventId?: string };
    const userId = req.user?.id || '';
    if (!req.user?.id || !eventId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const result = await this.service.createBooth(userId, eventId, req.body);
    res.status(201).json(ApiResponse.success(result, 'Booth created'));
  });

  listBooths = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventId } = req.params as { eventId?: string };
    const userId = req.user?.id || '';
    if (!req.user?.id || !eventId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const result = await this.service.listBooths(eventId, userId, { limit, cursor });
    res.status(200).json(ApiResponse.success(result, 'Booths listed'));
  });

  getSingleBooth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventId, boothId } = req.params as { eventId?: string; boothId?: string };
    const userId = req.user?.id || '';
    if (!req.user?.id || !eventId || !boothId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const result = await this.service.getSingleBooth(eventId, userId, boothId);
    res.status(200).json(ApiResponse.success(result, 'Booth retrieved'));
  });
}
