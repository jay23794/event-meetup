import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  ownerUserId: mongoose.Types.ObjectId;
  name: string;
  startDate?: Date;
  endDate?: Date;
  sheetId: string;
  sheetUrl: string;
  boothCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    startDate: Date,
    endDate: Date,
    sheetId: { type: String, required: true },
    sheetUrl: { type: String, required: true },
    boothCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>('Event', eventSchema);
