import mongoose, { Schema, Document } from 'mongoose';

export interface IBooth extends Document {
  ownerUserId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  boothName?: string;
  scanCount: number;
  hasVoiceNote: boolean;
  sheetRowNumber: number;
  createdAt: Date;
}

const boothSchema = new Schema<IBooth>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    boothName: String,
    scanCount: { type: Number, default: 0 },
    hasVoiceNote: { type: Boolean, default: false },
    sheetRowNumber: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Booth = mongoose.model<IBooth>('Booth', boothSchema);
