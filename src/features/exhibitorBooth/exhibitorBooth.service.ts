import { customAlphabet } from 'nanoid';
import { google } from 'googleapis';
import mongoose from 'mongoose';
import { ExhibitorBoothRepository } from './exhibitorBooth.repository';
import { VisitorCheckIn } from './visitorCheckIn.model';
import { VisitorScannedBooth } from '@/features/visitor/visitorScannedBooth.model';
import { EventRepository } from '@/features/event/event.repository';
import { AuthRepository } from '@/features/auth/auth.repository';
import { ExhibitorDocumentRepository } from '@/features/exhibitorDocument/exhibitorDocument.repository';
import { ExhibitorDocument } from '@/features/exhibitorDocument/exhibitorDocument.model';
import { ApiError } from '@/shared/utils/ApiError';
import { config } from '@/config/env';
import { CreateExhibitorBoothInput, UpdateExhibitorBoothInput, CreateBoothWithDocumentsInput } from './exhibitorBooth.schema';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { verifyToken } from '@/shared/utils/jwt';
import { anthropic } from '@/config/anthropic';
import { DOCUMENT_EXTRACTION_PROMPT } from '@/features/scan/scan.prompt';

const generateQrId = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  10
);

export class ExhibitorBoothService {
  private repository: ExhibitorBoothRepository;
  private eventRepository: EventRepository;
  private authRepository: AuthRepository;
  private docRepository: ExhibitorDocumentRepository;

  constructor() {
    this.repository = new ExhibitorBoothRepository();
    this.eventRepository = new EventRepository();
    this.authRepository = new AuthRepository();
    this.docRepository = new ExhibitorDocumentRepository();
  }

  async createBooth(userId: string, eventId: string, payload: CreateExhibitorBoothInput) {
    const event = await this.eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }

    const qrId = generateQrId();
    const qrUrl = `${config.PUBLIC_APP_URL}/exhibitor/${qrId}`;

    return this.repository.create({
      ownerUserId: userId,
      eventId,
      boothName: payload.boothName,
      description: payload.description,
      qrId,
      qrUrl,
    });
  }

  async getBooth(userId: string, boothId: string) {
    const booth = await this.repository.findById(boothId);
    if (!booth) {
      throw ApiError.notFound('Exhibitor booth not found');
    }
    if (booth.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this booth');
    }
    return booth;
  }

  async updateBooth(userId: string, boothId: string, payload: UpdateExhibitorBoothInput) {
    await this.getBooth(userId, boothId);

    const updates: Partial<{ boothName: string; description: string }> = {};
    if (payload.boothName !== undefined) updates.boothName = payload.boothName;
    if (payload.description !== undefined) updates.description = payload.description;

    return this.repository.update(boothId, updates);
  }

  async listByEvent(userId: string, eventId: string) {
    const event = await this.eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }
    return this.repository.listByEvent(eventId);
  }

  async getBoothByQrId(qrId: string) {
    const booth = await this.repository.findByQrId(qrId);
    if (!booth) {
      throw ApiError.notFound('Booth not found');
    }
    return booth;
  }

  async checkInVisitor(
    qrId: string,
    visitorData: { name: string; email: string; phone?: string },
    authToken?: string
  ): Promise<{ alreadyCheckedIn: boolean; booth: any }> {
    const booth = await this.repository.findByQrId(qrId);
    if (!booth) {
      throw ApiError.notFound('Booth not found');
    }

    const event = await this.eventRepository.findEventById(booth.eventId.toString());
    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const exhibitor = await this.authRepository.findUserByIdWithRefreshToken(
      booth.ownerUserId.toString()
    );
    if (!exhibitor) {
      throw new ApiError(412, 'Exhibitor account not found');
    }

    // Optional visitor user id (when scanning while signed in)
    let visitorUserId: string | undefined;
    if (authToken) {
      try {
        const payload = verifyToken(authToken);
        visitorUserId = payload.id;
      } catch {
        // ignore — treat as anonymous check-in
      }
    }

    // Exhibitor-side check-in (unique on boothId+email)
    let alreadyCheckedIn = false;
    try {
      await VisitorCheckIn.create({
        exhibitorBoothId: booth._id,
        eventId: booth.eventId,
        visitorUserId: visitorUserId ? new mongoose.Types.ObjectId(visitorUserId) : undefined,
        name: visitorData.name,
        email: visitorData.email,
        phone: visitorData.phone,
      });
      await this.repository.incrementScanCount(booth._id.toString());
    } catch (error: any) {
      if (error?.code === 11000) {
        alreadyCheckedIn = true;
      } else {
        throw error;
      }
    }

    // Public documents — used both for visitor's record and for Drive sharing
    const publicDocuments = await ExhibitorDocument.find({
      exhibitorBoothId: booth._id,
      isPublic: true,
    });
    const sharedDocUrls = publicDocuments
      .map((d) => d.driveFileUrl)
      .filter((url): url is string => !!url);

    // Drive share (best-effort; non-fatal)
    if (exhibitor.googleRefreshToken && publicDocuments.length > 0) {
      try {
        await this.shareDocumentsWithVisitor(
          publicDocuments,
          exhibitor.googleRefreshToken,
          visitorData.email
        );
      } catch (error) {
        console.error('[CheckIn] doc sharing FAIL (non-fatal):', error);
      }
    }

    // Visitor's scanned-booth record
    if (visitorUserId) {
      try {
        await VisitorScannedBooth.updateOne(
          { visitorUserId: new mongoose.Types.ObjectId(visitorUserId), qrId: booth.qrId },
          {
            $setOnInsert: {
              visitorUserId: new mongoose.Types.ObjectId(visitorUserId),
              exhibitorBoothId: booth._id,
              qrId: booth.qrId,
              boothName: booth.boothName,
              eventName: event.name,
              sharedDocUrls,
            },
          },
          { upsert: true }
        );
      } catch (error) {
        console.error('[CheckIn] visitor scanned-booth record FAIL (non-fatal):', error);
      }
    }

    return {
      alreadyCheckedIn,
      booth: {
        boothName: booth.boothName,
        description: booth.description,
        scanCount: alreadyCheckedIn ? booth.scanCount : booth.scanCount + 1,
      },
    };
  }

  private async shareDocumentsWithVisitor(
    documents: any[],
    exhibitorRefreshToken: string,
    visitorEmail: string
  ): Promise<void> {
    if (documents.length === 0) return;

    const auth = createOAuthClient(exhibitorRefreshToken);
    const drive = google.drive({ version: 'v3', auth: auth as any });

    for (const doc of documents) {
      try {
        await drive.permissions.create({
          fileId: doc.driveFileId,
          sendNotificationEmail: false,
          requestBody: {
            type: 'user',
            role: 'reader',
            emailAddress: visitorEmail,
          },
        });
      } catch (error: any) {
        if (!error?.message?.includes('already')) {
          console.error('[CheckIn] share failed', { fileName: doc.fileName, message: error?.message });
        }
      }
    }
  }

  async listVisitorScannedBooths(
    userId: string,
    opts: { limit?: number; cursor?: number } = {}
  ): Promise<{
    booths: Array<{
      timestamp: string;
      boothName: string;
      eventName: string;
      qrId: string;
      sharedDocuments: Array<{
        url: string;
        fileId?: string;
        fileName?: string;
        mimeType?: string;
        fileType?: 'card' | 'brochure';
        thumbnailUrl?: string;
      }>;
    }>;
    nextCursor: number | null;
    total: number;
  }> {
    const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);
    const cursor = Math.max(opts.cursor ?? 0, 0);

    const visitorObjId = new mongoose.Types.ObjectId(userId);

    const total = await VisitorScannedBooth.countDocuments({ visitorUserId: visitorObjId });
    if (total === 0) {
      return { booths: [], nextCursor: null, total: 0 };
    }

    const page = await VisitorScannedBooth.find({ visitorUserId: visitorObjId })
      .sort({ createdAt: -1 })
      .skip(cursor)
      .limit(limit)
      .lean();

    const nextCursor = cursor + page.length < total ? cursor + page.length : null;

    const pageUrls = Array.from(new Set(page.flatMap((p) => p.sharedDocUrls ?? [])));
    const docs = pageUrls.length
      ? await ExhibitorDocument.find({ driveFileUrl: { $in: pageUrls } })
      : [];
    const docByUrl = new Map(docs.map((d) => [d.driveFileUrl, d]));

    const booths = page.map((entry) => ({
      timestamp: entry.createdAt.toISOString(),
      boothName: entry.boothName,
      eventName: entry.eventName,
      qrId: entry.qrId,
      sharedDocuments: (entry.sharedDocUrls ?? []).map((url) => {
        const doc = docByUrl.get(url);
        if (!doc) return { url };
        return {
          url,
          fileId: doc.driveFileId,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          fileType: doc.fileType,
          thumbnailUrl: `https://drive.google.com/thumbnail?id=${doc.driveFileId}&sz=w400`,
        };
      }),
    }));

    return { booths, nextCursor, total };
  }

  async createBoothWithDocuments(
    userId: string,
    eventId: string,
    payload: CreateBoothWithDocumentsInput & {
      documents: Array<{
        rawText: string;
        fileType: 'card' | 'brochure';
        fileName: string;
        driveFileId?: string;
        driveFileUrl?: string;
        mimeType?: string;
        sizeBytes?: number;
        isPublic?: boolean;
      }>;
    }
  ) {
    const event = await this.eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }

    const qrId = generateQrId();
    const qrUrl = `${config.PUBLIC_APP_URL}/exhibitor/${qrId}`;

    const booth = await this.repository.create({
      ownerUserId: userId,
      eventId,
      boothName: payload.boothName,
      description: payload.description,
      qrId,
      qrUrl,
    });

    const processedDocs: Array<{
      id: mongoose.Types.ObjectId;
      fileName: string;
      fileType: 'card' | 'brochure';
      extractedName?: string;
      extractedCompany?: string;
      extractedEmail?: string;
      extractedPhone?: string;
      extractedTitle?: string;
      extractedWebsite?: string;
      extractedAddress?: string;
    }> = [];

    for (const doc of payload.documents) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `${DOCUMENT_EXTRACTION_PROMPT}\n\nOCR Text:\n${doc.rawText}`,
            },
          ],
        });

        const textContent = response.content.find((c) => c.type === 'text');
        if (!textContent || textContent.type !== 'text') {
          throw new ApiError(502, 'Anthropic API returned unexpected response');
        }

        const cleanText = textContent.text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanText);

        const createdDoc = await this.docRepository.create({
          ownerUserId: userId,
          exhibitorBoothId: booth._id.toString(),
          eventId,
          driveFileId: doc.driveFileId,
          driveFileUrl: doc.driveFileUrl,
          fileName: doc.fileName,
          fileType: doc.fileType,
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes,
          extractedText: doc.rawText,
          extractedName: parsed.name || undefined,
          extractedCompany: parsed.company || undefined,
          extractedTitle: parsed.title || undefined,
          extractedPhone: parsed.phone || undefined,
          extractedEmail: parsed.email || undefined,
          extractedWebsite: parsed.website || undefined,
          extractedAddress: parsed.address || undefined,
          extractionStatus: 'success',
          isPublic: doc.isPublic ?? true,
        });

        await this.repository.incrementDocumentCount(booth._id.toString());

        processedDocs.push({
          id: createdDoc._id,
          fileName: createdDoc.fileName,
          fileType: createdDoc.fileType,
          extractedName: createdDoc.extractedName,
          extractedCompany: createdDoc.extractedCompany,
          extractedEmail: createdDoc.extractedEmail,
          extractedPhone: createdDoc.extractedPhone,
          extractedTitle: createdDoc.extractedTitle,
          extractedWebsite: createdDoc.extractedWebsite,
          extractedAddress: createdDoc.extractedAddress,
        });
      } catch (err) {
        console.error('[CreateBoothWithDocuments] Document processing error:', {
          fileName: doc.fileName,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      booth: {
        id: booth._id,
        boothName: booth.boothName,
        description: booth.description,
        qrId: booth.qrId,
        qrUrl: booth.qrUrl,
      },
      documents: processedDocs,
    };
  }
}
