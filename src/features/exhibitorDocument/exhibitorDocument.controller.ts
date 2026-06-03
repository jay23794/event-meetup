import { Request, Response } from 'express';
import { ExhibitorDocumentService } from './exhibitorDocument.service';
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

export class ExhibitorDocumentController {
  private service: ExhibitorDocumentService;

  constructor() {
    this.service = new ExhibitorDocumentService();
  }

  listByBooth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { boothId } = req.params as { boothId?: string };
    const userId = req.user?.id;
    if (!userId || !boothId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const fileType = req.query.fileType as 'card' | 'brochure' | undefined;
    const documents = await this.service.listByBooth(userId, boothId, { fileType });
    res.status(200).json(ApiResponse.success({ documents }, 'Exhibitor documents listed'));
  });
}
