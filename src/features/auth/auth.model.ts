import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
  googleRefreshToken?: string;
  meetSyncRootFolderId?: string;
  myBoothsFolderId?: string;
  visitedBoothsFolderId?: string;
  visitedBoothsSheetId?: string;
  hasCreatedBooth: boolean;
  hasScannedBooth: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    googleRefreshToken: { type: String, select: false },
    meetSyncRootFolderId: String,
    myBoothsFolderId: String,
    visitedBoothsFolderId: String,
    visitedBoothsSheetId: String,
    hasCreatedBooth: { type: Boolean, default: false, index: true },
    hasScannedBooth: { type: Boolean, default: false, index: true },
    lastActiveAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
