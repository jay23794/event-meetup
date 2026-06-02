import { customAlphabet } from 'nanoid';
import { BoothRepository } from './booth.repository';
import { EventRepository } from '@/features/event/event.repository';
import { EventService } from '@/features/event/event.service';
import { ApiError } from '@/shared/utils/ApiError';
import { CacheService } from '@/shared/cache/cache.service';
import { config } from '@/config/env';
import { CreateBoothInput, ListBoothsQuery } from './booth.schema';
import { IBoothScan } from './booth.model';

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

    const scans: IBoothScan[] = (data.scans ?? []).map((s) => ({
      rawText: s.rawText,
      extractedFields: {
        name: s.extractedFields.name ?? undefined,
        company: s.extractedFields.company ?? undefined,
        title: s.extractedFields.title ?? undefined,
        phone: s.extractedFields.phone ?? undefined,
        email: s.extractedFields.email ?? undefined,
        website: s.extractedFields.website ?? undefined,
        linkedin: s.extractedFields.linkedin ?? undefined,
        socialMedia: s.extractedFields.socialMedia ?? [],
        address: s.extractedFields.address ?? undefined,
      },
      imageUrl: s.imageUrl,
      driveFileId: s.driveFileId,
    }));

    const scanCount = scans.length;
    const names = scans.map((s) => s.extractedFields.name).filter((v): v is string => !!v);
    const phones = scans.map((s) => s.extractedFields.phone).filter((v): v is string => !!v);
    const emails = scans.map((s) => s.extractedFields.email).filter((v): v is string => !!v);
    const companies = scans.map((s) => s.extractedFields.company).filter((v): v is string => !!v);
    const websites = scans.map((s) => s.extractedFields.website).filter((v): v is string => !!v);
    const linkedinUrls = scans.map((s) => s.extractedFields.linkedin).filter((v): v is string => !!v);
    const socialMediaUrls = scans.flatMap((s) => s.extractedFields.socialMedia ?? []).filter((v): v is string => !!v);
    const imageUrls = scans.map((s) => s.imageUrl).filter((v): v is string => !!v);

    const qrId = data.qrId || generateQrId();
    const qrUrl = `${config.PUBLIC_APP_URL}/scan/${qrId}`;

    const booth = await this.repository.createBooth({
      ownerUserId: userId,
      eventId,
      boothName: data.boothName,
      description: data.description,
      qrId,
      qrUrl,
      scans,
      scanCount,
      voiceTranscript: data.voiceNote?.transcript,
      voiceDurationSec: data.voiceNote?.durationSec,
      hasVoiceNote: !!data.voiceNote,
      names,
      phones,
      emails,
      companies,
      websites,
      linkedinUrls,
      socialMediaUrls,
      imageUrls,
    });

    await this.eventRepository.incrementBoothCount(eventId);

    this.cacheService.invalidatePattern(`booths:${eventId}:*`);
    this.cacheService.invalidatePattern(`summary:${eventId}`);
    this.cacheService.invalidatePattern(`booth:${eventId}:*`);

    return {
      boothId: booth._id.toString(),
      qrId,
      qrUrl,
    };
  }

  async listBooths(eventId: string, userId: string, query: ListBoothsQuery) {
    const limit = query.limit || 50;
    const cursor = query.cursor;

    await this.eventService.getEvent(eventId, userId);

    const cacheKey = `booths:${eventId}:${cursor || 'start'}:${limit}`;
    const cachedResult = this.cacheService.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const { booths, nextCursor } = await this.repository.listBoothsPaged(eventId, cursor, limit);

    const event = await this.eventRepository.findEventById(eventId);
    const result = {
      booths,
      nextCursor,
      total: event?.boothCount ?? 0,
    };

    this.cacheService.set(cacheKey, result, 60);
    return result;
  }

  async getSingleBooth(eventId: string, userId: string, boothId: string) {
    await this.eventService.getEvent(eventId, userId);

    const cacheKey = `booth:${eventId}:${boothId}`;
    const cachedResult = this.cacheService.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const doc = await this.repository.findBoothById(boothId);
    if (!doc || doc.eventId.toString() !== eventId) {
      throw ApiError.notFound('Booth not found');
    }

    const result = { booth: this.repository.toBoothRow(doc) };
    this.cacheService.set(cacheKey, result, 60);
    return result;
  }
}
