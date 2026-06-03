import { Request, Response } from 'express';
import { ExhibitorDocumentService, exhibitorDocumentService } from '@/service/exhibitorDocument.service';
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

export class ExhibitorDocumentController {
  constructor(private service: ExhibitorDocumentService = exhibitorDocumentService) {}

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

export const exhibitorDocumentController = new ExhibitorDocumentController();
