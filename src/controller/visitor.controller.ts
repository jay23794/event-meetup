import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '@/errors/ApiError';
import { successResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { VisitorService } from '@/service/visitor.service';


interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

const listScannedBoothsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.coerce.number().int().nonnegative().optional(),
});


  export const listScannedBooths = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();
    const { limit, cursor } = listScannedBoothsQuerySchema.parse(req.query);
    const result = await VisitorService.listVisitorScannedBooths(userId, {
      limit,
      cursor,
    });
    res.status(200).json(successResponse(result, 'Visitor scanned booths listed'));
  });

