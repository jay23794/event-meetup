import sharp from 'sharp';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SCAN_CONFIG } from '@/config/scan';
import { BUSINESS_CARD_EXTRACTION_PROMPT } from './scan.prompt';
import { EventRepository } from '@/features/event/event.repository';
import { User } from '@/features/auth/auth.model';
import { ApiError } from '@/shared/utils/ApiError';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { DriveClient } from '@/shared/google/drive.client';
import { ExtractedFields, ScanResult } from './scan.types';
import { config } from '@/config/env';

export class ScanService {
  private eventRepository: EventRepository;

  constructor() {
    this.eventRepository = new EventRepository();
  }

  async processScan(userId: string, eventId: string, imageBuffer: Buffer): Promise<ScanResult> {
    let compressedBuffer: Buffer | null = null;

    try {
      const event = await this.eventRepository.findEventById(eventId);
      if (!event) {
        throw ApiError.notFound('Event not found');
      }
      if (event.ownerUserId.toString() !== userId) {
        throw ApiError.forbidden('You do not have access to this event');
      }

      const user = await User.findById(userId).select('+googleRefreshToken');
      if (!user?.googleRefreshToken) {
        throw new ApiError(412, 'Reconnect Google account with Drive permission');
      }

      compressedBuffer = await this.compressImage(imageBuffer);
      const { extractedFields, rawText } = await this.extractWithClaude(compressedBuffer);

      const { imageUrl, fileId } = await this.uploadToDrive(
        user,
        eventId,
        event.name,
        imageBuffer
      );

      return {
        extractedFields,
        rawText,
        imageUrl,
        driveFileId: fileId,
      };
    } finally {
      if (compressedBuffer) {
        compressedBuffer = null;
      }
    }
  }

  private async compressImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(SCAN_CONFIG.COMPRESSED_MAX_WIDTH, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: SCAN_CONFIG.COMPRESSED_JPEG_QUALITY })
      .toBuffer();
  }

  private async extractWithClaude(
    compressedBuffer: Buffer
  ): Promise<{ extractedFields: ExtractedFields; rawText: string }> {
    try {
      const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: SCAN_CONFIG.GEMINI_MODEL });

      const base64Image = compressedBuffer.toString('base64');

      const response = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        },
        {
          text: BUSINESS_CARD_EXTRACTION_PROMPT,
        },
      ]);

      const result = await response.response;
      const text = result.text();

      let cleanText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      return {
        extractedFields: {
          name: parsed.name || null,
          company: parsed.company || null,
          title: parsed.title || null,
          phone: parsed.phone || null,
          email: parsed.email || null,
          website: parsed.website || null,
          address: parsed.address || null,
        },
        rawText: parsed.rawText || '',
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof SyntaxError) {
        throw new ApiError(502, 'Failed to parse Gemini response', { code: 'INVALID_JSON' });
      }
      console.error('Gemini extraction error:', error);
      throw new ApiError(502, 'Gemini API unavailable', { code: 'GEMINI_ERROR' });
    }
  }

  private async uploadToDrive(
    user: any,
    eventId: string,
    eventName: string,
    imageBuffer: Buffer
  ): Promise<{ imageUrl: string; fileId: string }> {
    try {
      const event = await this.eventRepository.findEventById(eventId);
      if (!event) throw ApiError.notFound('Event not found');

      const oauthClient = createOAuthClient(user.googleRefreshToken!);
      const driveClient = new DriveClient(oauthClient);

      let rootFolderId = event.driveRootFolderId;
      if (!rootFolderId) {
        rootFolderId = await driveClient.ensureFolder(oauthClient, 'Meet Sync', null);
        await this.eventRepository.updateEvent(eventId, { driveRootFolderId: rootFolderId });
      }

      let eventFolderId = event.driveEventFolderId;
      if (!eventFolderId) {
        eventFolderId = await driveClient.ensureFolder(oauthClient, eventName, rootFolderId);
        await this.eventRepository.updateEvent(eventId, { driveEventFolderId: eventFolderId });
      }

      let imagesFolderId = event.driveImagesFolderId;
      if (!imagesFolderId) {
        imagesFolderId = await driveClient.ensureFolder(oauthClient, 'images', eventFolderId);
        await this.eventRepository.updateEvent(eventId, { driveImagesFolderId: imagesFolderId });
      }

      const timestamp = Date.now();
      const { nanoid } = await import('nanoid');
      const randomSuffix = nanoid(4);
      const filename = `${timestamp}_${randomSuffix}.jpg`;

      const { fileId, webContentLink } = await driveClient.uploadImage(
        oauthClient,
        imagesFolderId,
        imageBuffer,
        filename
      );

      const shareableUrl = await driveClient.makeShareable(oauthClient, fileId);

      return {
        imageUrl: shareableUrl,
        fileId,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        throw new ApiError(412, 'Reconnect Google account', { code: 'GOOGLE_AUTH_EXPIRED' });
      }
      throw new ApiError(502, 'Failed to upload image to Drive', { code: 'DRIVE_UPLOAD_ERROR' });
    }
  }
}
