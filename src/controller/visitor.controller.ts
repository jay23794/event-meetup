import { Request, Response } from 'express';
import {
  ExhibitorBoothService,
  exhibitorBoothService,
} from '@/service/exhibitorBooth.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

export class VisitorController {
  constructor(private boothService: ExhibitorBoothService = exhibitorBoothService) {}

  listScannedBooths = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const cursor = req.query.cursor ? parseInt(String(req.query.cursor), 10) : undefined;
    const result = await this.boothService.listVisitorScannedBooths(userId, {
      limit: Number.isFinite(limit) ? limit : undefined,
      cursor: Number.isFinite(cursor) ? cursor : undefined,
    });
    res.status(200).json(ApiResponse.success(result, 'Visitor scanned booths listed'));
  });
}

export const visitorController = new VisitorController();
