import { EventRepository, eventRepository } from '@/repository/event.repository';
import { authRepository } from '@/repository/auth.repository';
import { createOAuthClient } from '@/libs/oauth.client';
import { CreateEventInput } from '@/types/zod/event.schema';
import { DriveService } from '@/service/drive.service';

export class EventService {
  constructor(private _repository: EventRepository = eventRepository) {}

  async listEvents(userId: string) {
    return this._repository.findEventsByOwner(userId);
  }

  async createEvent(userId: string, data: CreateEventInput) {
    const event = await this._repository.createEvent({
      ownerUserId: userId,
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });

    try {
      const user = await authRepository.findUserByIdWithRefreshTokenAndRoot(userId);
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

        await this._repository.updateEvent(event._id.toString(), {
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
