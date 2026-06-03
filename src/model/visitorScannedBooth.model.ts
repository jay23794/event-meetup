import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitorScannedBooth extends Document {
  _id: mongoose.Types.ObjectId;
  visitorUserId: mongoose.Types.ObjectId;
  exhibitorBoothId: mongoose.Types.ObjectId;
  qrId: string;
  boothName: string;
  eventName: string;
  sharedDocUrls: string[];
  createdAt: Date;
}

const visitorScannedBoothSchema = new Schema<IVisitorScannedBooth>(
  {
    visitorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exhibitorBoothId: { type: Schema.Types.ObjectId, ref: 'ExhibitorBooth', required: true },
    qrId: { type: String, required: true },
    boothName: { type: String, required: true },
    eventName: { type: String, required: true },
    sharedDocUrls: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

visitorScannedBoothSchema.index({ visitorUserId: 1, qrId: 1 }, { unique: true });
visitorScannedBoothSchema.index({ visitorUserId: 1, createdAt: -1 });

export const VisitorScannedBooth = mongoose.model<IVisitorScannedBooth>(
  'VisitorScannedBooth',
  visitorScannedBoothSchema
);
