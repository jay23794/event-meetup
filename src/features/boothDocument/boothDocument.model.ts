import mongoose, { Schema, Document } from 'mongoose';

export interface IBoothDocument extends Document {
  ownerUserId: mongoose.Types.ObjectId;
  boothId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  driveFileId: string;
  driveFileUrl: string;
  fileName: string;
  fileType: 'card' | 'brochure';
  mimeType?: string;
  sizeBytes?: number;
  isPublic: boolean;
  extractedText?: string;
  createdAt: Date;
}

const boothDocumentSchema = new Schema<IBoothDocument>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    boothId: { type: Schema.Types.ObjectId, ref: 'Booth', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    driveFileId: { type: String, required: true },
    driveFileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['card', 'brochure'], required: true },
    mimeType: String,
    sizeBytes: Number,
    isPublic: { type: Boolean, default: false },
    extractedText: String,
  },
  { timestamps: true }
);

export const BoothDocument = mongoose.model<IBoothDocument>('BoothDocument', boothDocumentSchema);
