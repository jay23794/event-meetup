import mongoose from 'mongoose';
import { VisitorCheckIn, IVisitorCheckIn } from '@/model/visitorCheckIn.model';
import { handleMongooseError } from '@/errors';
import { ConflictError } from '@/errors';

export class VisitorCheckInRepository {
  /**
   * Creates a visitor check-in. Returns `{ alreadyCheckedIn: true }` when
   * the (exhibitorBoothId, email) unique index rejects the insert.
   */
  async create(data: {
    exhibitorBoothId: mongoose.Types.ObjectId | string;
    eventId: mongoose.Types.ObjectId | string;
    visitorUserId?: string;
    name: string;
    email: string;
    phone?: string;
  }): Promise<{ alreadyCheckedIn: boolean; checkIn?: IVisitorCheckIn }> {
    try {
      const checkIn = await VisitorCheckIn.create({
        exhibitorBoothId:
          typeof data.exhibitorBoothId === 'string'
            ? new mongoose.Types.ObjectId(data.exhibitorBoothId)
            : data.exhibitorBoothId,
        eventId:
          typeof data.eventId === 'string'
            ? new mongoose.Types.ObjectId(data.eventId)
            : data.eventId,
        visitorUserId: data.visitorUserId
          ? new mongoose.Types.ObjectId(data.visitorUserId)
          : undefined,
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      return { alreadyCheckedIn: false, checkIn };
    } catch (error) {
      const wrapped = handleMongooseError(error);
      if (wrapped instanceof ConflictError) {
        return { alreadyCheckedIn: true };
      }
      throw wrapped;
    }
  }
}

export const visitorCheckInRepository = new VisitorCheckInRepository();
