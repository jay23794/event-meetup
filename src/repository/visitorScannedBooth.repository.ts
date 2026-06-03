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

  async listByVisitorPaginated(
    visitorUserId: string,
    opts: { skip: number; limit: number }
  ): Promise<IVisitorScannedBooth[]> {
    try {
      return (await VisitorScannedBooth.find({
        visitorUserId: new mongoose.Types.ObjectId(visitorUserId),
      })
        .sort({ createdAt: -1 })
        .skip(opts.skip)
        .limit(opts.limit)
        .lean()) as unknown as IVisitorScannedBooth[];
    } catch (error) {
      throw handleMongooseError(error);
    }
  }
}

export const visitorScannedBoothRepository = new VisitorScannedBoothRepository();
