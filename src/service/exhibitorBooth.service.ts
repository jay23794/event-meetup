import { customAlphabet } from 'nanoid';
import mongoose from 'mongoose';
import { ExhibitorBoothRepository } from '@/repository/exhibitorBooth.repository';
import { EventRepository } from '@/repository/event.repository';
import { ExhibitorDocumentRepository } from '@/repository/exhibitorDocument.repository';
import { ApiError } from '@/errors/ApiError';
import { config } from '@/config/env';
import {
  CreateBoothWithDocumentsInput,
  CreateEventWithBoothAndDocumentsInput,
} from '@/types/zod/exhibitorBooth.schema';
import { anthropic } from '@/libs/anthropic';
import { DOCUMENT_EXTRACTION_PROMPT } from '@/libs/prompts/documentExtraction.prompt';
import { EventService } from './event.service';

const generateQrId = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  10
);

export class ExhibitorBoothService {
  constructor(
    private _repository: ExhibitorBoothRepository,
    private _eventRepository: EventRepository,
    private _docRepository: ExhibitorDocumentRepository,
    private _eventService: EventService
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

  async listPublicDocumentsByQrId(qrId: string) {
    const booth = await this.getBoothByQrId(qrId);
    return this._docRepository.listPublicByBoothId(booth._id);
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



