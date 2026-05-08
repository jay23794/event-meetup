import { Request, Response } from 'express';
import { BoothDocumentService } from './boothDocument.service';
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

export class BoothDocumentController {
  private service: BoothDocumentService;

  constructor() {
    this.service = new BoothDocumentService();
  }

  createDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { boothId } = req.params as { boothId?: string };
    const userId = req.user?.id || '';

    if (!req.user?.id || !boothId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }

    const result = await this.service.createDocument(userId, boothId, req.body);
    res.status(201).json(ApiResponse.success(result, 'Document registered'));
  });

  listDocuments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { boothId } = req.params as { boothId?: string };
    const userId = req.user?.id || '';

    if (!req.user?.id || !boothId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }

    const fileType = req.query.fileType as 'card' | 'brochure' | undefined;
    const result = await this.service.listByBooth(userId, boothId, { fileType });
    res.status(200).json(ApiResponse.success(result, 'Documents listed'));
  });

  deleteDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { docId } = req.params as { docId?: string };
    const userId = req.user?.id || '';

    if (!req.user?.id || !docId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }

    const result = await this.service.deleteDocument(userId, docId);
    res.status(200).json(ApiResponse.success(result, 'Document deleted'));
  });
}
