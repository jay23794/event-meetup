import mongoose from 'mongoose';
import { VisitorScannedBooth, IVisitorScannedBooth } from '@/model/visitorScannedBooth.model';
import { handleMongooseError } from '@/errors';

export class VisitorScannedBoothRepository {
  async upsertOne(data: {
    visitorUserId: string;
    exhibitorBoothId: mongoose.Types.ObjectId;
    qrId: string;
    boothName: string;
    eventName: string;
    sharedDocUrls: string[];
  }): Promise<void> {
    try {
      const visitorObjId = new mongoose.Types.ObjectId(data.visitorUserId);
      await VisitorScannedBooth.updateOne(
        { visitorUserId: visitorObjId, qrId: data.qrId },
        {
          $setOnInsert: {
            visitorUserId: visitorObjId,
            exhibitorBoothId: data.exhibitorBoothId,
            qrId: data.qrId,
            boothName: data.boothName,
            eventName: data.eventName,
            sharedDocUrls: data.sharedDocUrls,
          },
        },
        { upsert: true }
      );
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async countByVisitor(visitorUserId: string): Promise<number> {
    try {
      return await VisitorScannedBooth.countDocuments({
        visitorUserId: new mongoose.Types.ObjectId(visitorUserId),
      });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async listByVisitorWithCursor(
    visitorUserId: string,
    opts: { cursor?: string; limit: number }
  ): Promise<IVisitorScannedBooth[]> {
    try {
      const query: Record<string, unknown> = {
        visitorUserId: new mongoose.Types.ObjectId(visitorUserId),
      };
      if (opts.cursor && mongoose.Types.ObjectId.isValid(opts.cursor)) {
        query._id = { $lt: new mongoose.Types.ObjectId(opts.cursor) };
      }
      return (await VisitorScannedBooth.find(query)
        .sort({ _id: -1 })
        .limit(opts.limit)
        .lean()) as unknown as IVisitorScannedBooth[];
    } catch (error) {
      throw handleMongooseError(error);
    }
  }
}

export const visitorScannedBoothRepository = new VisitorScannedBoothRepository();
