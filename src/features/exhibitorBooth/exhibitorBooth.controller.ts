import { Request, Response } from 'express';
import { ExhibitorBoothService } from './exhibitorBooth.service';
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

export class ExhibitorBoothController {
  private service: ExhibitorBoothService;

  constructor() {
    this.service = new ExhibitorBoothService();
  }

  createBooth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventId } = req.params as { eventId?: string };
    const userId = req.user?.id;
    if (!userId || !eventId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const booth = await this.service.createBooth(userId, eventId, req.body);
    res.status(201).json(ApiResponse.success({ booth }, 'Exhibitor booth created'));
  });

  listByEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventId } = req.params as { eventId?: string };
    const userId = req.user?.id;
    if (!userId || !eventId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const booths = await this.service.listByEvent(userId, eventId);
    res.status(200).json(ApiResponse.success({ booths }, 'Exhibitor booths listed'));
  });

  getBooth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { boothId } = req.params as { boothId?: string };
    const userId = req.user?.id;
    if (!userId || !boothId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const booth = await this.service.getBooth(userId, boothId);
    res.status(200).json(ApiResponse.success({ booth }, 'Exhibitor booth retrieved'));
  });

  updateBooth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { boothId } = req.params as { boothId?: string };
    const userId = req.user?.id;
    if (!userId || !boothId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const booth = await this.service.updateBooth(userId, boothId, req.body);
    res.status(200).json(ApiResponse.success({ booth }, 'Exhibitor booth updated'));
  });
}
