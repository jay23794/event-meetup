import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '@/errors/ApiError';
import { asyncHandler } from '@/utils/asyncHandler';
import { successResponse } from '@/utils/ApiResponse';
import { exhibitorBoothService } from '@/infra/container';
import { createEventWithBoothAndDocumentsSchema } from '@/types/zod/exhibitorBooth.schema';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

export const eventIdParamSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
});

export const qrIdParamSchema = z.object({
  qrId: z.string().min(1, 'qrId is required'),
});

export const checkInBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
});


 export const listByEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();
    const { eventId } = eventIdParamSchema.parse(req.params);
    const booths = await exhibitorBoothService.listByEvent(userId, eventId);
    res.status(200).json(successResponse({ booths }));
  });

  export const  getBoothByQrId = asyncHandler(async (req: Request, res: Response) => {
    const { qrId } = qrIdParamSchema.parse(req.params);
    const booth = await exhibitorBoothService.getBoothByQrId(qrId);
    res.status(200).json(successResponse({ booth }));
  });

   export const  checkInVisitor = asyncHandler(async (req: Request, res: Response) => {
    const { qrId } = qrIdParamSchema.parse(req.params);
    const body = checkInBodySchema.parse(req.body);
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const result = await exhibitorBoothService.checkInVisitor(qrId, body, authToken);
    res.status(200).json(successResponse(result));
  });

  export const   listPublicDocuments = asyncHandler(async (req: Request, res: Response) => {
    const { qrId } = qrIdParamSchema.parse(req.params);
    const documents = await exhibitorBoothService.listPublicDocumentsByQrId(qrId);
    res.status(200).json(successResponse({ documents }));
  });

export const createEventWithBoothAndDocuments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();
    const body = createEventWithBoothAndDocumentsSchema.parse(req.body);
    const result = await exhibitorBoothService.createEventWithBoothAndDocuments(userId, body);
    res.status(201).json(successResponse(result, 'Event, booth and documents created'));
  }
);





