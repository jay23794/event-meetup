import sharp from 'sharp';
import { anthropic } from '@/config/anthropic';
import { SCAN_CONFIG } from '@/config/scan';
import { BUSINESS_CARD_EXTRACTION_PROMPT } from './scan.prompt';
import { EventRepository } from '@/features/event/event.repository';
import { User } from '@/features/auth/auth.model';
import { ApiError } from '@/shared/utils/ApiError';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { DriveClient } from '@/shared/google/drive.client';
import { ExtractedFields, ScanResult } from './scan.types';

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
      const base64 = compressedBuffer.toString('base64');

      const response = await anthropic.messages.create({
        model: SCAN_CONFIG.ANTHROPIC_MODEL,
        max_tokens: SCAN_CONFIG.ANTHROPIC_MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: BUSINESS_CARD_EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new ApiError(502, 'Claude API returned unexpected response');
      }

      let cleanText = textContent.text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      const socialMedia = Array.isArray(parsed.socialMedia)
        ? parsed.socialMedia.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        : [];

      return {
        extractedFields: {
          name: parsed.name || null,
          company: parsed.company || null,
          title: parsed.title || null,
          phone: parsed.phone || null,
          email: parsed.email || null,
          website: parsed.website || null,
          linkedin: parsed.linkedin || null,
          socialMedia,
          address: parsed.address || null,
        },
        rawText: parsed.rawText || '',
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof SyntaxError) {
        throw new ApiError(502, 'Failed to parse Claude response', { code: 'INVALID_JSON' });
      }
      throw new ApiError(502, 'Claude API unavailable', { code: 'ANTHROPIC_ERROR' });
    }
  }

  private async uploadToDrive(
    user: any,
    eventId: string,
    _eventName: string,
    imageBuffer: Buffer
  ): Promise<{ imageUrl: string; fileId: string }> {
    try {
      const event = await this.eventRepository.findEventById(eventId);
      if (!event) throw ApiError.notFound('Event not found');

      if (!event.driveImagesFolderId) {
        throw new ApiError(412, 'Event folders not initialized. Please recreate the event.');
      }

      const oauthClient = createOAuthClient(user.googleRefreshToken!);
      const driveClient = new DriveClient(oauthClient);

      const timestamp = Date.now();
      const { nanoid } = await import('nanoid');
      const randomSuffix = nanoid(4);
      const filename = `${timestamp}_${randomSuffix}.jpg`;

      const { fileId } = await driveClient.uploadImage(
        oauthClient,
        event.driveImagesFolderId,
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
