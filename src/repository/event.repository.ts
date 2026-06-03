import { Event, IEvent } from '@/model/event.model';
import mongoose from 'mongoose';

export class EventRepository {
  async findEventById(id: string): Promise<IEvent | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Event.findById(id);
  }

  async findEventsByOwner(ownerUserId: string): Promise<IEvent[]> {
    return Event.find({ ownerUserId: new mongoose.Types.ObjectId(ownerUserId) }).sort({ createdAt: -1 });
  }

  async createEvent(eventData: {
    ownerUserId: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IEvent> {
    const event = new Event({
      ...eventData,
      ownerUserId: new mongoose.Types.ObjectId(eventData.ownerUserId),
    });
    return event.save();
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
    return Event.findByIdAndUpdate(id, eventData, { new: true });
  }

  async deleteEvent(id: string): Promise<IEvent | null> {
    return Event.findByIdAndDelete(id);
  }

  async incrementBoothCount(eventId: string): Promise<void> {
    await Event.findByIdAndUpdate(eventId, { $inc: { boothCount: 1 } });
  }
}

export const eventRepository = new EventRepository();
