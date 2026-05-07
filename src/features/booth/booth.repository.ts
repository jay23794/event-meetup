import { Booth, IBooth } from './booth.model';
import mongoose from 'mongoose';

export class BoothRepository {
  async createBooth(boothData: {
    ownerUserId: string;
    eventId: string;
    boothName?: string;
    scanCount: number;
    hasVoiceNote: boolean;
    sheetRowNumber: number;
  }): Promise<IBooth> {
    const booth = new Booth({
      ownerUserId: new mongoose.Types.ObjectId(boothData.ownerUserId),
      eventId: new mongoose.Types.ObjectId(boothData.eventId),
      boothName: boothData.boothName,
      scanCount: boothData.scanCount,
      hasVoiceNote: boothData.hasVoiceNote,
      sheetRowNumber: boothData.sheetRowNumber,
    });
    return booth.save();
  }

  async findBoothsByEvent(eventId: string): Promise<IBooth[]> {
    return Booth.find({ eventId: new mongoose.Types.ObjectId(eventId) });
  }
}
