import { customAlphabet } from 'nanoid';
import { BoothRepository } from './booth.repository';
import { EventRepository } from '@/features/event/event.repository';
import { EventService } from '@/features/event/event.service';
import { User } from '@/features/auth/auth.model';
import { ApiError } from '@/shared/utils/ApiError';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { SheetsClient } from '@/shared/google/sheets.client';
import { CacheService } from '@/shared/cache/cache.service';
import { config } from '@/config/env';
import { CreateBoothInput, ListBoothsQuery } from './booth.schema';

const generateQrId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

export class BoothService {
  private repository: BoothRepository;
  private eventRepository: EventRepository;
  private eventService: EventService;
  private cacheService: CacheService;

  constructor() {
    this.repository = new BoothRepository();
    this.eventRepository = new EventRepository();
    this.eventService = new EventService();
    this.cacheService = new CacheService();
  }

  async createBooth(userId: string, eventId: string, data: CreateBoothInput) {
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

    try {
      console.log('[Booth] Ensuring sheet created...');
      const { masterSheetId, tabName } = await this.eventService.ensureSheetCreated(eventId, userId);
      console.log('[Booth] Sheet ensured:', { masterSheetId, tabName });

      const oauthClient = createOAuthClient(user.googleRefreshToken);
      const sheetsClient = new SheetsClient(oauthClient);

      const timestamp = new Date().toISOString();
      const scanCount = data.scans?.length || 0;

      const names = data.scans?.map((s) => s.extractedFields.name).filter(Boolean) || [];
      const phones = data.scans?.map((s) => s.extractedFields.phone).filter(Boolean) || [];
      const emails = data.scans?.map((s) => s.extractedFields.email).filter(Boolean) || [];
      const companies = data.scans?.map((s) => s.extractedFields.company).filter(Boolean) || [];
      const websites = (data.scans?.map((s) => s.extractedFields.website).filter(Boolean) as string[]) || [];
      const linkedinUrls = (data.scans?.map((s) => s.extractedFields.linkedin).filter(Boolean) as string[]) || [];
      const socialMediaUrls = (data.scans?.flatMap((s) => s.extractedFields.socialMedia || []).filter(Boolean) as string[]) || [];
      const imageUrls = data.scans?.map((s) => s.imageUrl).filter(Boolean) || [];
      const rawOcrJson = JSON.stringify(data.scans || []);
      const voiceTranscript = data.voiceNote?.transcript || '';

      const rowValues = [
        timestamp,
        data.boothName || '',
        scanCount,
        names.join('; '),
        phones.join('; '),
        emails.join('; '),
        companies.join('; '),
        websites.join('; '),
        linkedinUrls.join('; '),
        socialMediaUrls.join('; '),
        rawOcrJson,
        voiceTranscript,
        imageUrls.join('; '),
      ];

      console.log('[Booth] Appending row to tab:', tabName);
      const { updatedRange } = await sheetsClient.appendRow(masterSheetId, rowValues, tabName);
      const sheetRowNumber = this._extractRowNumber(updatedRange);
      console.log('[Booth] Row appended successfully');

      const qrId = data.qrId || generateQrId();
      const qrUrl = `${config.PUBLIC_APP_URL}/scan/${qrId}`;

      const booth = await this.repository.createBooth({
        ownerUserId: userId,
        eventId,
        boothName: data.boothName,
        description: data.description,
        qrId,
        qrUrl,
        scanCount,
        hasVoiceNote: !!data.voiceNote,
        sheetRowNumber,
        websites,
        linkedinUrls,
        socialMediaUrls,
      });

      await this.eventRepository.incrementBoothCount(eventId);

      // Invalidate all caches for this event
      this.cacheService.invalidatePattern(`booths:${eventId}:*`);
      this.cacheService.invalidatePattern(`summary:${eventId}`);
      this.cacheService.invalidatePattern(`booth:${eventId}:*`);

      return {
        boothId: booth._id,
        sheetRowNumber,
        qrId,
        qrUrl,
      };
    } catch (error) {
      console.error('[Booth] Error in createBooth:', error instanceof Error ? error.message : error);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        throw new ApiError(502, 'Google Sheets unavailable', { code: 'GOOGLE_AUTH_EXPIRED' });
      }
      throw new ApiError(502, 'Google Sheets unavailable', { code: 'GOOGLE_API_ERROR' });
    }
  }

  async listBooths(eventId: string, userId: string, query: ListBoothsQuery) {
    const limit = query.limit || 50;
    const cursor = query.cursor;

    const event = await this.eventService.getEvent(eventId, userId);

    if (!event.sheetCreated || !event.sheetTabName) {
      return {
        booths: [],
        nextCursor: null,
        total: 0,
      };
    }

    const cacheKey = `booths:${eventId}:${cursor || 'start'}:${limit}`;
    const cachedResult = this.cacheService.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const user = await User.findById(userId).select(
        '+googleRefreshToken visitorBoothSheetId'
      );
      if (!user?.googleRefreshToken) {
        throw new ApiError(412, 'Reconnect Google account with Drive permission');
      }
      if (!user.visitorBoothSheetId) {
        return {
          booths: [],
          nextCursor: null,
          total: 0,
        };
      }

      const oauthClient = createOAuthClient(user.googleRefreshToken);
      const sheetsClient = new SheetsClient(oauthClient);

      const startRow = cursor || 2;
      const booths = await this.repository.readBoothRows(
        sheetsClient,
        user.visitorBoothSheetId,
        event.sheetTabName,
        startRow,
        limit
      );

      let nextCursor: number | null = null;
      if (booths.length > 0) {
        nextCursor = booths[booths.length - 1]!.rowNumber + 1;
      }

      const result = {
        booths,
        nextCursor,
        total: event.boothCount,
      };

      this.cacheService.set(cacheKey, result, 60);

      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        throw new ApiError(502, 'Google Sheets unavailable', { code: 'GOOGLE_AUTH_EXPIRED' });
      }
      throw new ApiError(502, 'Google Sheets unavailable', { code: 'GOOGLE_API_ERROR' });
    }
  }

  async getSingleBooth(eventId: string, userId: string, rowNumber: number) {
    const event = await this.eventService.getEvent(eventId, userId);

    if (!event.sheetCreated || !event.sheetTabName) {
      throw ApiError.notFound('Booth not found');
    }

    const cacheKey = `booth:${eventId}:${rowNumber}`;
    const cachedResult = this.cacheService.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const user = await User.findById(userId).select(
        '+googleRefreshToken visitorBoothSheetId'
      );
      if (!user?.googleRefreshToken) {
        throw new ApiError(412, 'Reconnect Google account with Drive permission');
      }
      if (!user.visitorBoothSheetId) {
        throw ApiError.notFound('Booth not found');
      }

      const oauthClient = createOAuthClient(user.googleRefreshToken);
      const sheetsClient = new SheetsClient(oauthClient);

      const booth = await this.repository.readBoothRow(
        sheetsClient,
        user.visitorBoothSheetId,
        event.sheetTabName,
        rowNumber
      );
      if (!booth) {
        throw ApiError.notFound('Booth not found');
      }

      const result = { booth };
      this.cacheService.set(cacheKey, result, 60);

      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        throw new ApiError(502, 'Google Sheets unavailable', { code: 'GOOGLE_AUTH_EXPIRED' });
      }
      throw new ApiError(502, 'Google Sheets unavailable', { code: 'GOOGLE_API_ERROR' });
    }
  }

  private _extractRowNumber(updatedRange: string | undefined): number {
    if (!updatedRange) return 0;
    const match = updatedRange.match(/!A(\d+):/);
    return match && match[1] ? parseInt(match[1], 10) : 0;
  }
}
