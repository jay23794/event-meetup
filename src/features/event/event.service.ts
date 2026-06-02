import { EventRepository } from './event.repository';
import { BoothRepository } from '@/features/booth/booth.repository';
import { User } from '@/features/auth/auth.model';
import { ApiError } from '@/shared/utils/ApiError';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { CacheService } from '@/shared/cache/cache.service';
import { CreateEventInput, UpdateEventInput } from './event.schema';
import { DriveService } from '@/features/drive/drive.service';

export class EventService {
  private repository: EventRepository;
  private boothRepository: BoothRepository;
  private cacheService: CacheService;

  constructor() {
    this.repository = new EventRepository();
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
    });

    try {
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
      }
    } catch (error) {
      console.warn('[EventService] Could not create folders for event:', error instanceof Error ? error.message : error);
    }

    return event;
  }

  async ensureEventFolders(eventId: string, userId: string) {
    const event = await this.getEvent(eventId, userId);

    if (event.driveEventFolderId && event.driveImagesFolderId) {
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
      const oauthClient = createOAuthClient(user.googleRefreshToken);
      const driveService = new DriveService(oauthClient);

      const eventFolderId = await driveService.ensureEventFolder(
        oauthClient,
        event.name,
        eventId,
        user.meetSyncRootFolderId
      );

      const boothFolderId = await driveService.ensureBoothFolder(oauthClient, eventFolderId);

      const updatedEvent = await this.repository.updateEvent(eventId, {
        driveEventFolderId: eventFolderId,
        driveImagesFolderId: boothFolderId,
      });

      return updatedEvent;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(502, 'Failed to create event folders', { code: 'DRIVE_FOLDER_ERROR' });
    }
  }

  async updateEvent(id: string, userId: string, data: UpdateEventInput) {
    await this.getEvent(id, userId);
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
    await this.getEvent(id, userId);

    const cacheKey = `summary:${id}`;
    const cachedResult = this.cacheService.get<any>(cacheKey);
    if (cachedResult) return cachedResult;

    const summary = await this.boothRepository.computeSummary(id);
    this.cacheService.set(cacheKey, summary, 60);
    return summary;
  }
}
