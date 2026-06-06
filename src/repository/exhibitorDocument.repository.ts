import mongoose from 'mongoose';
import { ExhibitorDocument, IExhibitorDocument } from '@/model/exhibitorDocument.model';
import { handleMongooseError } from '@/errors';

export class ExhibitorDocumentRepository {
  async create(data: {
    ownerUserId: string;
    exhibitorBoothId: string;
    eventId: string;
    driveFileId?: string;
    driveFileUrl?: string;
    fileName: string;
    fileType: 'card' | 'brochure';
    mimeType?: string;
    sizeBytes?: number;
    isPublic?: boolean;
    extractedText?: string;
    extractedName?: string;
    extractedCompany?: string;
    extractedTitle?: string;
    extractedPhone?: string;
    extractedEmail?: string;
    extractedWebsite?: string;
    extractedLinkedin?: string;
    extractedSocialMedia?: string[];
    extractedAddress?: string;
    extractionStatus?: 'pending' | 'success' | 'failed';
  }): Promise<IExhibitorDocument> {
    try {
      const document = new ExhibitorDocument({
        ownerUserId: new mongoose.Types.ObjectId(data.ownerUserId),
        exhibitorBoothId: new mongoose.Types.ObjectId(data.exhibitorBoothId),
        eventId: new mongoose.Types.ObjectId(data.eventId),
        driveFileId: data.driveFileId,
        driveFileUrl: data.driveFileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        isPublic: data.isPublic ?? false,
        extractedText: data.extractedText,
        extractedName: data.extractedName,
        extractedCompany: data.extractedCompany,
        extractedTitle: data.extractedTitle,
        extractedPhone: data.extractedPhone,
        extractedEmail: data.extractedEmail,
        extractedWebsite: data.extractedWebsite,
        extractedLinkedin: data.extractedLinkedin,
        extractedSocialMedia: data.extractedSocialMedia,
        extractedAddress: data.extractedAddress,
        extractionStatus: data.extractionStatus ?? 'pending',
      });
      return await document.save();
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async listByBoothIds(
    boothIds: Array<mongoose.Types.ObjectId | string>,
    fileType?: 'card' | 'brochure'
  ): Promise<IExhibitorDocument[]> {
    try {
      const ids = boothIds.map((b) =>
        typeof b === 'string' ? new mongoose.Types.ObjectId(b) : b
      );
      const query: Record<string, unknown> = { exhibitorBoothId: { $in: ids } };
      if (fileType) {
        query.fileType = fileType;
      }
      return await ExhibitorDocument.find(query).sort({ createdAt: -1 });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async listPublicByBoothId(boothId: mongoose.Types.ObjectId | string): Promise<IExhibitorDocument[]> {
    try {
      const id = typeof boothId === 'string' ? new mongoose.Types.ObjectId(boothId) : boothId;
      return await ExhibitorDocument.find({ exhibitorBoothId: id, isPublic: true });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async listPublicByBoothIds(
    boothIds: Array<mongoose.Types.ObjectId | string>
  ): Promise<IExhibitorDocument[]> {
    try {
      const ids = boothIds.map((b) =>
        typeof b === 'string' ? new mongoose.Types.ObjectId(b) : b
      );
      return await ExhibitorDocument.find({
        exhibitorBoothId: { $in: ids },
        isPublic: true,
      });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async findById(docId: string): Promise<IExhibitorDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return null;
    }
    try {
      return await ExhibitorDocument.findById(new mongoose.Types.ObjectId(docId));
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async deleteById(docId: string): Promise<IExhibitorDocument | null> {
    try {
      return await ExhibitorDocument.findByIdAndDelete(new mongoose.Types.ObjectId(docId));
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async updateById(docId: string, patch: Partial<IExhibitorDocument>): Promise<IExhibitorDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return null;
    }
    try {
      return await ExhibitorDocument.findByIdAndUpdate(new mongoose.Types.ObjectId(docId), patch, { new: true });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }
}

export const exhibitorDocumentRepository = new ExhibitorDocumentRepository();
