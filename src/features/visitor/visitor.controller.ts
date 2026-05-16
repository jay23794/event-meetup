import { Request, Response } from 'express';
import { ExhibitorBoothService } from '@/features/exhibitorBooth/exhibitorBooth.service';
import { ApiResponse } from '@/shared/utils/ApiResponse';
import { asyncHandler } from '@/shared/utils/asyncHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

export class VisitorController {
  private exhibitorBoothService: ExhibitorBoothService;

  constructor() {
    this.exhibitorBoothService = new ExhibitorBoothService();
  }

  listScannedBooths = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const cursor = req.query.cursor ? parseInt(String(req.query.cursor), 10) : undefined;
    const result = await this.exhibitorBoothService.listVisitorScannedBooths(userId, {
      limit: Number.isFinite(limit) ? limit : undefined,
      cursor: Number.isFinite(cursor) ? cursor : undefined,
    });
    res.status(200).json(ApiResponse.success(result, 'Visitor scanned booths listed'));
  });
}
