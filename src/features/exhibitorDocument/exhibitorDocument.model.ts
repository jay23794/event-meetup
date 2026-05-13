import mongoose, { Schema, Document } from 'mongoose';

export interface IExhibitorDocument extends Document {
  ownerUserId: mongoose.Types.ObjectId;
  exhibitorBoothId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  driveFileId: string;
  driveFileUrl: string;
  fileName: string;
  fileType: 'card' | 'brochure';
  mimeType?: string;
  sizeBytes?: number;
  isPublic: boolean;
  extractedText?: string;
  extractedName?: string;
  extractedCompany?: string;
  extractedTitle?: string;
  extractedPhone?: string;
  extractedEmail?: string;
  extractedWebsite?: string;
  extractedAddress?: string;
  extractionStatus: 'pending' | 'success' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const exhibitorDocumentSchema = new Schema<IExhibitorDocument>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exhibitorBoothId: { type: Schema.Types.ObjectId, ref: 'ExhibitorBooth', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    driveFileId: { type: String, required: true },
    driveFileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['card', 'brochure'], required: true },
    mimeType: String,
    sizeBytes: Number,
    isPublic: { type: Boolean, default: false },
    extractedText: String,
    extractedName: String,
    extractedCompany: String,
    extractedTitle: String,
    extractedPhone: String,
    extractedEmail: String,
    extractedWebsite: String,
    extractedAddress: String,
    extractionStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  },
  { timestamps: true }
);

export const ExhibitorDocument = mongoose.model<IExhibitorDocument>(
  'ExhibitorDocument',
  exhibitorDocumentSchema
);
