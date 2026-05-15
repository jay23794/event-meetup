import { EventRepository } from './event.repository';
import { AuthRepository } from '@/features/auth/auth.repository';
import { BoothRepository } from '@/features/booth/booth.repository';
import { User } from '@/features/auth/auth.model';
import { IEvent as IEventDoc } from './event.model';
import { ApiError } from '@/shared/utils/ApiError';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { SheetsClient } from '@/shared/google/sheets.client';
import { CacheService } from '@/shared/cache/cache.service';
import { CreateEventInput, UpdateEventInput } from './event.schema';
import { DriveService } from '@/features/drive/drive.service';

const MAX_TAB_NAME_LENGTH = 31; // Google Sheets limit

function buildTabName(eventName: string, eventId: string): string {
  const idSuffix = eventId.slice(-6);
  const suffix = ` (${idSuffix})`;
  const namePart = eventName.slice(0, MAX_TAB_NAME_LENGTH - suffix.length).trim();
  return `${namePart}${suffix}`;
}

const BOOTH_SHEET_HEADERS = [
  'Timestamp',
  'Booth Name',
  'Scan Count',
  'Names (joined)',
  'Phones (joined)',
  'Emails (joined)',
  'Companies (joined)',
  'Websites (joined)',
  'LinkedIn (joined)',
  'Social Media (joined)',
  'Raw OCR JSON',
  'Voice Transcript',
  'Image URLs (joined)',
];

export class EventService {
  private repository: EventRepository;
  private authRepository: AuthRepository;
  private boothRepository: BoothRepository;
  private cacheService: CacheService;

  constructor() {
    this.repository = new EventRepository();
    this.authRepository = new AuthRepository();
    this.boothRepository = new BoothRepository();
    this.cacheService = new CacheService();
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

    try {
      console.log('[EventService] Creating folders for new event:', event._id);
      const user = await User.findById(userId).select('+googleRefreshToken meetSyncRootFolderId');
      if (user?.googleRefreshToken && user.meetSyncRootFolderId) {
        const oauthClient = createOAuthClient(user.googleRefreshToken);
        const driveService = new DriveService(oauthClient);

        const eventFolderId = await driveService.ensureEventFolder(
          oauthClient,
          event.name,
          event._id.toString(),
          user.meetSyncRootFolderId
        );

        const boothFolderId = await driveService.ensureBoothFolder(oauthClient, eventFolderId);

        await this.repository.updateEvent(event._id.toString(), {
          driveEventFolderId: eventFolderId,
          driveImagesFolderId: boothFolderId,
        });

        console.log('[EventService] Event folders created successfully');
      }
    } catch (error) {
      console.warn('[EventService] Could not create folders for event (may not have Drive permission):', error instanceof Error ? error.message : error);
    }

    return event;
  }

  async ensureEventFolders(eventId: string, userId: string) {
    const event = await this.getEvent(eventId, userId);

    if (event.driveEventFolderId && event.driveImagesFolderId) {
      console.log('[EventService] Event folders already exist');
      return event;
    }

    const user = await User.findById(userId).select('+googleRefreshToken meetSyncRootFolderId');
    if (!user?.googleRefreshToken) {
      throw new ApiError(412, 'Reconnect Google account with Drive permission');
    }
    if (!user.meetSyncRootFolderId) {
      throw new ApiError(412, 'MeetSync folder not initialized');
    }

    try {
      console.log('[EventService] Creating event folders...');
      const oauthClient = createOAuthClient(user.googleRefreshToken);
      const driveService = new DriveService(oauthClient);

      const eventFolderId = await driveService.ensureEventFolder(
        oauthClient,
        event.name,
        eventId,
        user.meetSyncRootFolderId
      );
      console.log('[EventService] Event folder created:', eventFolderId);

      const boothFolderId = await driveService.ensureBoothFolder(oauthClient, eventFolderId);
      console.log('[EventService] Booth folder created:', boothFolderId);

      const updatedEvent = await this.repository.updateEvent(eventId, {
        driveEventFolderId: eventFolderId,
        driveImagesFolderId: boothFolderId,
      });

      return updatedEvent;
    } catch (error) {
      console.error('[EventService] Error in ensureEventFolders:', error instanceof Error ? error.message : error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(502, 'Failed to create event folders', { code: 'DRIVE_FOLDER_ERROR' });
    }
  }

  async ensureSheetCreated(eventId: string, userId: string): Promise<{
    event: IEventDoc;
    masterSheetId: string;
    masterSheetUrl: string;
    tabName: string;
  }> {
    const event = await this.getEvent(eventId, userId);

    const user = await User.findById(userId).select(
      '+googleRefreshToken visitorBoothSheetId visitorBoothSheetUrl'
    );
    if (!user?.googleRefreshToken) {
      throw new ApiError(412, 'Reconnect Google account with Drive permission');
    }

    try {
      const oauthClient = createOAuthClient(user.googleRefreshToken);
      const sheetsClient = new SheetsClient(oauthClient);

      let masterSheetId = user.visitorBoothSheetId;
      let masterSheetUrl = user.visitorBoothSheetUrl || '';
      let isNewMasterSheet = false;

      if (!masterSheetId) {
        console.log('[EventService] Creating visitor master sheet for user:', user.email);
        const created = await sheetsClient.createSheet(`${user.name} - Visitor Booths`);
        masterSheetId = created.sheetId;
        masterSheetUrl = created.sheetUrl;
        isNewMasterSheet = true;
        await this.authRepository.updateUser(userId, {
          visitorBoothSheetId: masterSheetId,
          visitorBoothSheetUrl: masterSheetUrl,
        });
        console.log('[EventService] Visitor master sheet saved on user:', { masterSheetId });
      } else {
        console.log('[EventService] Reusing visitor master sheet:', { masterSheetId });
      }

      if (event.sheetCreated && event.sheetTabName) {
        console.log('[EventService] Event tab already exists:', event.sheetTabName);
        return {
          event,
          masterSheetId,
          masterSheetUrl,
          tabName: event.sheetTabName,
        };
      }

      const tabName = buildTabName(event.name, event._id.toString());
      console.log('[EventService] Adding event tab to master sheet:', tabName);
      await sheetsClient.addSheet(masterSheetId, tabName);

      if (isNewMasterSheet) {
        try {
          await sheetsClient.deleteSheet(masterSheetId, 0);
        } catch (err) {
          console.warn('[EventService] Could not delete default Sheet1 (non-fatal):', err instanceof Error ? err.message : err);
        }
      }

      await sheetsClient.addHeaderRow(masterSheetId, BOOTH_SHEET_HEADERS, tabName);
      console.log('[EventService] Header row added to tab:', tabName);

      const updatedEvent = await this.repository.updateEvent(eventId, {
        sheetTabName: tabName,
        sheetCreated: true,
      });
      if (!updatedEvent) {
        throw ApiError.internal('Failed to persist sheet tab metadata');
      }

      return {
        event: updatedEvent,
        masterSheetId,
        masterSheetUrl,
        tabName,
      };
    } catch (error) {
      console.error('[EventService] Error in ensureSheetCreated:', error instanceof Error ? error.message : error, error instanceof Error ? error.stack : '');
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

  async getSummary(id: string, userId: string) {
    const event = await this.getEvent(id, userId);

    if (!event.sheetCreated || !event.sheetTabName) {
      return {
        totalBooths: 0,
        totalScans: 0,
        uniqueCompanies: 0,
        uniquePhones: 0,
        boothsWithVoiceNote: 0,
        lastBoothAt: null,
      };
    }

    const cacheKey = `summary:${id}`;
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
          totalBooths: 0,
          totalScans: 0,
          uniqueCompanies: 0,
          uniquePhones: 0,
          boothsWithVoiceNote: 0,
          lastBoothAt: null,
        };
      }

      const oauthClient = createOAuthClient(user.googleRefreshToken);
      const sheetsClient = new SheetsClient(oauthClient);

      const summary = await this.boothRepository.computeSummary(
        sheetsClient,
        user.visitorBoothSheetId,
        event.sheetTabName
      );
      this.cacheService.set(cacheKey, summary, 60);

      return summary;
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
}
