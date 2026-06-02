import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitorCheckIn extends Document {
  _id: mongoose.Types.ObjectId;
  exhibitorBoothId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  visitorUserId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
}

const visitorCheckInSchema = new Schema<IVisitorCheckIn>(
  {
    exhibitorBoothId: { type: Schema.Types.ObjectId, ref: 'ExhibitorBooth', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    visitorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

visitorCheckInSchema.index({ exhibitorBoothId: 1, email: 1 }, { unique: true });

export const VisitorCheckIn = mongoose.model<IVisitorCheckIn>('VisitorCheckIn', visitorCheckInSchema);
