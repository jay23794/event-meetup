import { customAlphabet } from 'nanoid';
import { google } from 'googleapis';
import mongoose from 'mongoose';
import { ExhibitorBoothRepository, exhibitorBoothRepository } from '@/repository/exhibitorBooth.repository';
import { VisitorCheckIn } from '@/model/visitorCheckIn.model';
import { VisitorScannedBooth } from '@/model/visitorScannedBooth.model';
import { EventRepository, eventRepository } from '@/repository/event.repository';
import { EventService, eventService } from '@/service/event.service';
import { AuthRepository, authRepository } from '@/repository/auth.repository';
import { ExhibitorDocumentRepository, exhibitorDocumentRepository } from '@/repository/exhibitorDocument.repository';
import { ExhibitorDocument } from '@/model/exhibitorDocument.model';
import { ApiError } from '@/errors/ApiError';
import { config } from '@/config/env';
import {
  CreateBoothWithDocumentsInput,
  CreateEventWithBoothAndDocumentsInput,
} from '@/types/zod/exhibitorBooth.schema';
import { createOAuthClient } from '@/libs/oauth.client';
import { DriveClient } from '@/libs/drive.client';
import { User } from '@/model/auth.model';
import { verifyToken } from '@/utils/jwt';
import { anthropic } from '@/libs/anthropic';
import { DOCUMENT_EXTRACTION_PROMPT } from '@/libs/prompts/documentExtraction.prompt';

const generateQrId = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  10
);

export class ExhibitorBoothService {
  constructor(
    private _repository: ExhibitorBoothRepository,
    private _eventRepository: EventRepository ,
    private _eventService: EventService ,
    private _authRepository: AuthRepository,
    private _docRepository: ExhibitorDocumentRepository 
  ) {}

  async listByEvent(userId: string, eventId: string) {
    const event = await this._eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }
    return this._repository.listByEvent(eventId);
  }

  async getBoothByQrId(qrId: string) {
    const booth = await this._repository.findByQrId(qrId);
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
    const booth = await this._repository.findByQrId(qrId);
    if (!booth) {
      throw ApiError.notFound('Booth not found');
    }

    const event = await this._eventRepository.findEventById(booth.eventId.toString());
    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    const exhibitor = await this._authRepository.findUserByIdWithRefreshToken(
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
      await this._repository.incrementScanCount(booth._id.toString());
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

    // Drive share — only when visitor is signed in with Google (best-effort; non-fatal)
    if (
      visitorUserId &&
      exhibitor.googleRefreshToken &&
      publicDocuments.length > 0
    ) {
      try {
        await this.shareDocumentsWithVisitor(
          publicDocuments,
          exhibitor.googleRefreshToken,
          visitorUserId,
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
    visitorUserId: string,
    visitorEmail: string
  ): Promise<void> {
    if (documents.length === 0) return;

    const visitor = await User.findById(visitorUserId).select(
      '+googleRefreshToken meetSyncRootFolderId visitedBoothsFolderId'
    );
    if (!visitor?.googleRefreshToken) {
      console.log('[CheckIn] visitor has no Google refresh token — skipping share');
      return;
    }

    const visitorAuth = createOAuthClient(visitor.googleRefreshToken);
    const driveClient = new DriveClient(visitorAuth);

    let rootFolderId = visitor.meetSyncRootFolderId;
    if (!rootFolderId) {
      rootFolderId = await driveClient.ensureFolder(visitorAuth, 'MeetSync', null);
    }
    let sharedFolderId = visitor.visitedBoothsFolderId;
    if (!sharedFolderId) {
      sharedFolderId = await driveClient.ensureSharedBoothsFolder(visitorAuth, rootFolderId);
    }
    if (
      rootFolderId !== visitor.meetSyncRootFolderId ||
      sharedFolderId !== visitor.visitedBoothsFolderId
    ) {
      await User.updateOne(
        { _id: visitor._id },
        { meetSyncRootFolderId: rootFolderId, visitedBoothsFolderId: sharedFolderId }
      );
    }

    const exhibitorAuth = createOAuthClient(exhibitorRefreshToken);
    const exhibitorDrive = google.drive({ version: 'v3', auth: exhibitorAuth as any });

    for (const doc of documents) {
      if (!doc.driveFileId) continue;
      try {
        await exhibitorDrive.permissions.create({
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
          console.error('[CheckIn] permission grant failed', {
            fileName: doc.fileName,
            message: error?.message,
          });
          continue;
        }
      }

      try {
        const existing = await driveClient.findShortcutToTarget(
          visitorAuth,
          doc.driveFileId,
          sharedFolderId
        );
        if (!existing) {
          await driveClient.createShortcutToFile(
            visitorAuth,
            doc.driveFileId,
            doc.fileName,
            sharedFolderId
          );
        }
      } catch (error: any) {
        console.error('[CheckIn] shortcut create failed', {
          fileName: doc.fileName,
          message: error?.message,
        });
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
      contacts: {
        names: string[];
        companies: string[];
        titles: string[];
        phones: string[];
        emails: string[];
        websites: string[];
        socials: string[];
        addresses: string[];
      };
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

    const boothObjectIds = page.map((p) => p.exhibitorBoothId);
    const allDocs = boothObjectIds.length
      ? await ExhibitorDocument.find({
          exhibitorBoothId: { $in: boothObjectIds },
          isPublic: true,
        })
      : [];

    const docsByBoothId = new Map<string, typeof allDocs>();
    for (const d of allDocs) {
      const key = d.exhibitorBoothId.toString();
      const list = docsByBoothId.get(key) ?? [];
      list.push(d);
      docsByBoothId.set(key, list);
    }

    const docByUrl = new Map<string, (typeof allDocs)[number]>();
    for (const d of allDocs) {
      if (d.driveFileUrl) docByUrl.set(d.driveFileUrl, d);
    }

    const dedupe = (values: (string | undefined | null)[]): string[] => {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const raw of values) {
        if (!raw) continue;
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(trimmed);
      }
      return out;
    };

    const booths = page.map((entry) => {
      const boothDocs = docsByBoothId.get(entry.exhibitorBoothId.toString()) ?? [];

      const socials = dedupe([
        ...boothDocs.map((d) => d.extractedLinkedin),
        ...boothDocs.flatMap((d) => d.extractedSocialMedia ?? []),
      ]);

      return {
        timestamp: entry.createdAt.toISOString(),
        boothName: entry.boothName,
        eventName: entry.eventName,
        qrId: entry.qrId,
        contacts: {
          names: dedupe(boothDocs.map((d) => d.extractedName)),
          companies: dedupe(boothDocs.map((d) => d.extractedCompany)),
          titles: dedupe(boothDocs.map((d) => d.extractedTitle)),
          phones: dedupe(boothDocs.map((d) => d.extractedPhone)),
          emails: dedupe(boothDocs.map((d) => d.extractedEmail)),
          websites: dedupe(boothDocs.map((d) => d.extractedWebsite)),
          socials,
          addresses: dedupe(boothDocs.map((d) => d.extractedAddress)),
        },
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
      };
    });

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
    const event = await this._eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }

    const qrId = generateQrId();
    const qrUrl = `${config.PUBLIC_APP_URL}/exhibitor/${qrId}`;

    const booth = await this._repository.create({
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

        const createdDoc = await this._docRepository.create({
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
          extractedLinkedin: parsed.linkedin || undefined,
          extractedSocialMedia: Array.isArray(parsed.socialMedia)
            ? parsed.socialMedia.filter(
                (s: unknown): s is string => typeof s === 'string' && !!s.trim()
              )
            : undefined,
          extractedAddress: parsed.address || undefined,
          extractionStatus: 'success',
          isPublic: doc.isPublic ?? true,
        });

        await this._repository.incrementDocumentCount(booth._id.toString());

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

  async createEventWithBoothAndDocuments(
    userId: string,
    payload: CreateEventWithBoothAndDocumentsInput
  ) {
    const event = await this._eventService.createEvent(userId, {
      name: payload.eventName,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    const boothResult = await this.createBoothWithDocuments(userId, event._id.toString(), {
      boothName: payload.boothName,
      description: payload.description,
      documents: payload.documents,
    });

    return {
      event: {
        id: event._id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        driveEventFolderId: event.driveEventFolderId,
        driveImagesFolderId: event.driveImagesFolderId,
      },
      ...boothResult,
    };
  }
}

