import { Request, Response } from 'express';
import { ScanService } from './scan.service';
import { scanBodySchema } from './scan.schema';
import { ApiResponse } from '@/shared/utils/ApiResponse';
import { asyncHandler } from '@/shared/utils/asyncHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
  file?: Express.Multer.File;
}

export class ScanController {
  private service: ScanService;

  constructor() {
    this.service = new ScanService();
  }

  scanImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }

    if (!req.file) {
      return res.status(400).json(ApiResponse.error('Image file is required'));
    }

    const bodyValidation = scanBodySchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json(ApiResponse.error('Invalid eventId'));
    }

    const result = await this.service.processScan(req.user.id, bodyValidation.data.eventId, req.file.buffer);
    res.status(200).json(ApiResponse.success(result, 'Scan processed'));
  });
}
