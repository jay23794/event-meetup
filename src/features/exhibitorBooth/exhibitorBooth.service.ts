import { customAlphabet } from 'nanoid';
import { ExhibitorBoothRepository } from './exhibitorBooth.repository';
import { EventRepository } from '@/features/event/event.repository';
import { ApiError } from '@/shared/utils/ApiError';
import { config } from '@/config/env';
import { CreateExhibitorBoothInput, UpdateExhibitorBoothInput } from './exhibitorBooth.schema';

const generateQrId = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  10
);

export class ExhibitorBoothService {
  private repository: ExhibitorBoothRepository;
  private eventRepository: EventRepository;

  constructor() {
    this.repository = new ExhibitorBoothRepository();
    this.eventRepository = new EventRepository();
  }

  async createBooth(userId: string, eventId: string, payload: CreateExhibitorBoothInput) {
    const event = await this.eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }

    const qrId = generateQrId();
    const qrUrl = `${config.PUBLIC_APP_URL}/exhibitor/${qrId}`;

    return this.repository.create({
      ownerUserId: userId,
      eventId,
      boothName: payload.boothName,
      description: payload.description,
      qrId,
      qrUrl,
    });
  }

  async getBooth(userId: string, boothId: string) {
    const booth = await this.repository.findById(boothId);
    if (!booth) {
      throw ApiError.notFound('Exhibitor booth not found');
    }
    if (booth.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this booth');
    }
    return booth;
  }

  async updateBooth(userId: string, boothId: string, payload: UpdateExhibitorBoothInput) {
    await this.getBooth(userId, boothId);

    const updates: Partial<{ boothName: string; description: string }> = {};
    if (payload.boothName !== undefined) updates.boothName = payload.boothName;
    if (payload.description !== undefined) updates.description = payload.description;

    return this.repository.update(boothId, updates);
  }

  async listByEvent(userId: string, eventId: string) {
    const event = await this.eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }
    return this.repository.listByEvent(eventId);
  }
}
