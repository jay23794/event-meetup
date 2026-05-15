import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  ownerUserId: mongoose.Types.ObjectId;
  name: string;
  startDate?: Date;
  endDate?: Date;
  sheetTabName?: string;
  sheetCreated: boolean;
  docExtractSheetId?: string;
  docExtractSheetUrl?: string;
  boothCount: number;
  driveRootFolderId?: string;
  driveEventFolderId?: string;
  driveImagesFolderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    startDate: Date,
    endDate: Date,
    sheetTabName: String,
    sheetCreated: { type: Boolean, default: false },
    docExtractSheetId: String,
    docExtractSheetUrl: String,
    boothCount: { type: Number, default: 0 },
    driveRootFolderId: String,
    driveEventFolderId: String,
    driveImagesFolderId: String,
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>('Event', eventSchema);
