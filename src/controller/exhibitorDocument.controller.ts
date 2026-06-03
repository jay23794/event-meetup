import { Request, Response } from 'express';
import { z } from 'zod';
import { exhibitorDocumentService } from '@/service/exhibitorDocument.service';
import { ApiError } from '@/errors/ApiError';
import { successResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

const paramsSchema = z.object({
  boothId: z.string().min(1, 'boothId is required'),
});

const querySchema = z.object({
  fileType: z.enum(['card', 'brochure']).optional(),
});

export class ExhibitorDocumentController {
  listByBooth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();
    const { boothId } = paramsSchema.parse(req.params);
    const query = querySchema.parse(req.query);
    const documents = await exhibitorDocumentService.listByBooth(userId, boothId, query);
    res.status(200).json(successResponse({ documents }, 'Exhibitor documents listed'));
  });
}

export const exhibitorDocumentController = new ExhibitorDocumentController();
