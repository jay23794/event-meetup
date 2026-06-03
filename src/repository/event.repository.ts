import { Event, IEvent } from '@/model/event.model';
import mongoose from 'mongoose';
import { handleMongooseError } from '@/errors';

export class EventRepository {
  async findEventById(id: string): Promise<IEvent | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    try {
      return await Event.findById(id);
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async findEventsByOwner(ownerUserId: string): Promise<IEvent[]> {
    try {
      return await Event.find({ ownerUserId: new mongoose.Types.ObjectId(ownerUserId) }).sort({
        createdAt: -1,
      });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async createEvent(eventData: {
    ownerUserId: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IEvent> {
    try {
      const event = new Event({
        ...eventData,
        ownerUserId: new mongoose.Types.ObjectId(eventData.ownerUserId),
      });
      return await event.save();
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async updateEvent(
    id: string,
    eventData: Partial<{
      name: string;
      startDate: Date;
      endDate: Date;
      driveRootFolderId: string;
      driveEventFolderId: string;
      driveImagesFolderId: string;
    }>
  ): Promise<IEvent | null> {
    try {
      return await Event.findByIdAndUpdate(id, eventData, { new: true });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async deleteEvent(id: string): Promise<IEvent | null> {
    try {
      return await Event.findByIdAndDelete(id);
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async incrementBoothCount(eventId: string): Promise<void> {
    try {
      await Event.findByIdAndUpdate(eventId, { $inc: { boothCount: 1 } });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }
}

export const eventRepository = new EventRepository();
