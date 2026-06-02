import mongoose, { Schema, Document } from 'mongoose';

export interface IBoothScanExtractedFields {
  name?: string;
  company?: string;
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  linkedin?: string;
  socialMedia?: string[];
  address?: string;
}

export interface IBoothScan {
  rawText: string;
  extractedFields: IBoothScanExtractedFields;
  imageUrl?: string;
  driveFileId?: string;
}

export interface IBooth extends Document {
  _id: mongoose.Types.ObjectId;
  ownerUserId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  boothName?: string;
  description?: string;
  qrId: string;
  qrUrl: string;
  scans: IBoothScan[];
  scanCount: number;
  voiceTranscript?: string;
  voiceDurationSec?: number;
  hasVoiceNote: boolean;
  names: string[];
  phones: string[];
  emails: string[];
  companies: string[];
  websites: string[];
  linkedinUrls: string[];
  socialMediaUrls: string[];
  imageUrls: string[];
  createdAt: Date;
}

const extractedFieldsSchema = new Schema<IBoothScanExtractedFields>(
  {
    name: String,
    company: String,
    title: String,
    phone: String,
    email: String,
    website: String,
    linkedin: String,
    socialMedia: { type: [String], default: [] },
    address: String,
  },
  { _id: false }
);

const scanSchema = new Schema<IBoothScan>(
  {
    rawText: { type: String, default: '' },
    extractedFields: { type: extractedFieldsSchema, default: () => ({}) },
    imageUrl: String,
    driveFileId: String,
  },
  { _id: false }
);

const boothSchema = new Schema<IBooth>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    boothName: String,
    description: { type: String, maxlength: 5000 },
    qrId: { type: String, required: true, unique: true, index: true },
    qrUrl: { type: String, required: true },
    scans: { type: [scanSchema], default: [] },
    scanCount: { type: Number, default: 0 },
    voiceTranscript: String,
    voiceDurationSec: Number,
    hasVoiceNote: { type: Boolean, default: false },
    names: { type: [String], default: [] },
    phones: { type: [String], default: [] },
    emails: { type: [String], default: [] },
    companies: { type: [String], default: [] },
    websites: { type: [String], default: [] },
    linkedinUrls: { type: [String], default: [] },
    socialMediaUrls: { type: [String], default: [] },
    imageUrls: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Booth = mongoose.model<IBooth>('Booth', boothSchema);
