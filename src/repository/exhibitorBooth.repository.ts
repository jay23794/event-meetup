import mongoose from 'mongoose';
import { ExhibitorBooth, IExhibitorBooth } from '@/model/exhibitorBooth.model';
import { handleMongooseError } from '@/errors';

export class ExhibitorBoothRepository {
  async create(data: {
    ownerUserId: string;
    eventId: string;
    boothName: string;
    description: string;
    qrId: string;
    qrUrl: string;
  }): Promise<IExhibitorBooth> {
    try {
      const booth = new ExhibitorBooth({
        ownerUserId: new mongoose.Types.ObjectId(data.ownerUserId),
        eventId: new mongoose.Types.ObjectId(data.eventId),
        boothName: data.boothName,
        description: data.description,
        qrId: data.qrId,
        qrUrl: data.qrUrl,
      });
      return await booth.save();
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async findById(boothId: string): Promise<IExhibitorBooth | null> {
    if (!mongoose.Types.ObjectId.isValid(boothId)) {
      return null;
    }
    try {
      return await ExhibitorBooth.findById(new mongoose.Types.ObjectId(boothId));
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async update(
    boothId: string,
    data: Partial<{ boothName: string; description: string }>
  ): Promise<IExhibitorBooth | null> {
    try {
      return await ExhibitorBooth.findByIdAndUpdate(boothId, data, { new: true });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async delete(boothId: string): Promise<IExhibitorBooth | null> {
    try {
      return await ExhibitorBooth.findByIdAndDelete(boothId);
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async listByEvent(eventId: string): Promise<IExhibitorBooth[]> {
    try {
      return await ExhibitorBooth.find({ eventId: new mongoose.Types.ObjectId(eventId) }).sort({
        createdAt: -1,
      });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async listByOwner(ownerUserId: string): Promise<IExhibitorBooth[]> {
    try {
      return await ExhibitorBooth.find({ ownerUserId: new mongoose.Types.ObjectId(ownerUserId) }).sort({
        createdAt: -1,
      });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async incrementDocumentCount(boothId: string): Promise<void> {
    try {
      await ExhibitorBooth.findByIdAndUpdate(boothId, { $inc: { documentCount: 1 } });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async decrementDocumentCount(boothId: string): Promise<void> {
    try {
      await ExhibitorBooth.findByIdAndUpdate(boothId, { $inc: { documentCount: -1 } });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async findByQrId(qrId: string): Promise<IExhibitorBooth | null> {
    try {
      return await ExhibitorBooth.findOne({ qrId });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async incrementScanCount(boothId: string): Promise<void> {
    try {
      await ExhibitorBooth.findByIdAndUpdate(boothId, { $inc: { scanCount: 1 } });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }
}

export const exhibitorBoothRepository = new ExhibitorBoothRepository();
