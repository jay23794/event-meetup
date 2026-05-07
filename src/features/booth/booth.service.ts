import { BoothRepository } from './booth.repository';
import { EventRepository } from '@/features/event/event.repository';
import { User } from '@/features/auth/auth.model';
import { ApiError } from '@/shared/utils/ApiError';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { SheetsClient } from '@/shared/google/sheets.client';
import { CreateBoothInput } from './booth.schema';

export class BoothService {
  private repository: BoothRepository;
  private eventRepository: EventRepository;

  constructor() {
    this.repository = new BoothRepository();
    this.eventRepository = new EventRepository();
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
      const oauthClient = createOAuthClient(user.googleRefreshToken);
      const sheetsClient = new SheetsClient(oauthClient);

      const timestamp = new Date().toISOString();
      const scanCount = data.scans?.length || 0;

      const names = data.scans?.map((s) => s.extractedFields.name).filter(Boolean) || [];
      const phones = data.scans?.map((s) => s.extractedFields.phone).filter(Boolean) || [];
      const emails = data.scans?.map((s) => s.extractedFields.email).filter(Boolean) || [];
      const companies = data.scans?.map((s) => s.extractedFields.company).filter(Boolean) || [];
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
        rawOcrJson,
        voiceTranscript,
        imageUrls.join('; '),
      ];

      const { updatedRange } = await sheetsClient.appendRow(event.sheetId, rowValues);
      const sheetRowNumber = this._extractRowNumber(updatedRange);

      const booth = await this.repository.createBooth({
        ownerUserId: userId,
        eventId,
        boothName: data.boothName,
        scanCount,
        hasVoiceNote: !!data.voiceNote,
        sheetRowNumber,
      });

      await this.eventRepository.incrementBoothCount(eventId);

      return {
        boothId: booth._id,
        sheetRowNumber,
      };
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
