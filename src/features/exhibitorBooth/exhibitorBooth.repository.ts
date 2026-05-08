import mongoose from 'mongoose';
import { ExhibitorBooth, IExhibitorBooth } from './exhibitorBooth.model';

export class ExhibitorBoothRepository {
  async create(data: {
    ownerUserId: string;
    eventId: string;
    boothName: string;
    description: string;
    qrId: string;
    qrUrl: string;
  }): Promise<IExhibitorBooth> {
    const booth = new ExhibitorBooth({
      ownerUserId: new mongoose.Types.ObjectId(data.ownerUserId),
      eventId: new mongoose.Types.ObjectId(data.eventId),
      boothName: data.boothName,
      description: data.description,
      qrId: data.qrId,
      qrUrl: data.qrUrl,
    });
    return booth.save();
  }

  async findById(boothId: string): Promise<IExhibitorBooth | null> {
    if (!mongoose.Types.ObjectId.isValid(boothId)) {
      return null;
    }
    return ExhibitorBooth.findById(new mongoose.Types.ObjectId(boothId));
  }

  async update(
    boothId: string,
    data: Partial<{ boothName: string; description: string }>
  ): Promise<IExhibitorBooth | null> {
    return ExhibitorBooth.findByIdAndUpdate(boothId, data, { new: true });
  }

  async delete(boothId: string): Promise<IExhibitorBooth | null> {
    return ExhibitorBooth.findByIdAndDelete(boothId);
  }

  async listByEvent(eventId: string): Promise<IExhibitorBooth[]> {
    return ExhibitorBooth.find({ eventId: new mongoose.Types.ObjectId(eventId) }).sort({
      createdAt: -1,
    });
  }

  async listByOwner(ownerUserId: string): Promise<IExhibitorBooth[]> {
    return ExhibitorBooth.find({ ownerUserId: new mongoose.Types.ObjectId(ownerUserId) }).sort({
      createdAt: -1,
    });
  }
}
