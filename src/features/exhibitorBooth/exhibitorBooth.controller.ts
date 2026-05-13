import { Request, Response } from 'express';
import { ExhibitorBoothService } from './exhibitorBooth.service';
import { ApiResponse } from '@/shared/utils/ApiResponse';
import { asyncHandler } from '@/shared/utils/asyncHandler';
import { ExhibitorDocument } from '@/features/exhibitorDocument/exhibitorDocument.model';

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

  getBoothByQrId = asyncHandler(async (req: Request, res: Response) => {
    const { qrId } = req.params as { qrId?: string };
    if (!qrId) {
      return res.status(400).json(ApiResponse.error('QR ID is required'));
    }
    const booth = await this.service.getBoothByQrId(qrId);
    res.status(200).json(ApiResponse.success({ booth }, 'Booth retrieved'));
  });

  checkInVisitor = asyncHandler(async (req: Request, res: Response) => {
    const { qrId } = req.params as { qrId?: string };
    const { name, email, phone } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
    };

    console.log('[CheckIn-Controller] incoming request', {
      qrId,
      hasName: !!name,
      hasEmail: !!email,
      hasPhone: !!phone,
      hasAuthHeader: !!req.headers.authorization,
    });

    if (!qrId || !name || !email) {
      console.log('[CheckIn-Controller] FAIL: missing fields', { qrId, name, email });
      return res.status(400).json(
        ApiResponse.error('QR ID, name, and email are required')
      );
    }

    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const result = await this.service.checkInVisitor(qrId, { name, email, phone }, authToken);

    console.log('[CheckIn-Controller] success response', { alreadyCheckedIn: result.alreadyCheckedIn });
    res.status(200).json(ApiResponse.success(result, 'Check-in successful'));
  });

  listPublicDocuments = asyncHandler(async (req: Request, res: Response) => {
    const { qrId } = req.params as { qrId?: string };
    if (!qrId) {
      return res.status(400).json(ApiResponse.error('QR ID is required'));
    }

    const booth = await this.service.getBoothByQrId(qrId);
    const documents = await ExhibitorDocument.find({
      exhibitorBoothId: booth._id,
      isPublic: true,
    });

    res.status(200).json(
      ApiResponse.success({ documents }, 'Public documents retrieved')
    );
  });

  createBoothWithDocuments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventId } = req.params as { eventId?: string };
    const userId = req.user?.id;
    if (!userId || !eventId) {
      return res.status(401).json(ApiResponse.error('Unauthorized'));
    }
    const result = await this.service.createBoothWithDocuments(userId, eventId, req.body);
    res.status(201).json(ApiResponse.success(result, 'Booth created with documents'));
  });
}
