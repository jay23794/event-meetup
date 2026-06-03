import { EventRepository, eventRepository } from '@/repository/event.repository';
import { User } from '@/model/auth.model';
import { createOAuthClient } from '@/libs/oauth.client';
import { CreateEventInput } from '@/types/zod/event.schema';
import { DriveService } from '@/service/drive.service';

export class EventService {
  constructor(private repository: EventRepository = eventRepository) {}

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
}

export const eventService = new EventService();
