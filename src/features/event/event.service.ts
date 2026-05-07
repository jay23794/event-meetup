import { EventRepository } from './event.repository';
import { User } from '@/features/auth/auth.model';
import { ApiError } from '@/shared/utils/ApiError';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { SheetsClient } from '@/shared/google/sheets.client';
import { CreateEventInput, UpdateEventInput } from './event.schema';

const BOOTH_SHEET_HEADERS = [
  'Timestamp',
  'Booth Name',
  'Scan Count',
  'Names (joined)',
  'Phones (joined)',
  'Emails (joined)',
  'Companies (joined)',
  'Raw OCR JSON',
  'Voice Transcript',
  'Image URLs (joined)',
];

export class EventService {
  private repository: EventRepository;

  constructor() {
    this.repository = new EventRepository();
  }

  async getEvent(id: string, userId: string) {
    const event = await this.repository.findEventById(id);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }
    return event;
  }

  async listEvents(userId: string) {
    return this.repository.findEventsByOwner(userId);
  }

  async createEvent(userId: string, data: CreateEventInput) {
    const event = await this.repository.createEvent({
      ownerUserId: userId,
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      sheetCreated: false,
    });

    return event;
  }

  async ensureSheetCreated(eventId: string, userId: string) {
    const event = await this.getEvent(eventId, userId);

    if (event.sheetCreated) {
      return event;
    }

    const user = await User.findById(userId).select('+googleRefreshToken');
    if (!user?.googleRefreshToken) {
      throw new ApiError(412, 'Reconnect Google account with Drive permission');
    }

    try {
      const oauthClient = createOAuthClient(user.googleRefreshToken);
      const sheetsClient = new SheetsClient(oauthClient);

      const { sheetId, sheetUrl } = await sheetsClient.createSheet(`${event.name} - Booth Log`);
      await sheetsClient.addHeaderRow(sheetId, BOOTH_SHEET_HEADERS);

      const updatedEvent = await this.repository.updateEvent(eventId, {
        sheetId,
        sheetUrl,
        sheetCreated: true,
      });

      return updatedEvent;
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

  async updateEvent(id: string, userId: string, data: UpdateEventInput) {
    const event = await this.getEvent(id, userId);
    return this.repository.updateEvent(id, {
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
  }

  async deleteEvent(id: string, userId: string) {
    await this.getEvent(id, userId);
    return this.repository.deleteEvent(id);
  }
}
