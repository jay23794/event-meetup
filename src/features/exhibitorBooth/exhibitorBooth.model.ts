import mongoose, { Schema, Document } from 'mongoose';

export interface IExhibitorBooth extends Document {
  ownerUserId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  boothName: string;
  description: string;
  qrId: string;
  qrUrl: string;
  documentCount: number;
  scanCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const exhibitorBoothSchema = new Schema<IExhibitorBooth>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    boothName: { type: String, required: true },
    description: { type: String, required: true, maxlength: 5000 },
    qrId: { type: String, required: true, unique: true, index: true },
    qrUrl: { type: String, required: true },
    documentCount: { type: Number, default: 0 },
    scanCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ExhibitorBooth = mongoose.model<IExhibitorBooth>('ExhibitorBooth', exhibitorBoothSchema);
