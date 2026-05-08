import mongoose from 'mongoose';
import { ExhibitorDocument, IExhibitorDocument } from './exhibitorDocument.model';

export class ExhibitorDocumentRepository {
  async create(data: {
    ownerUserId: string;
    exhibitorBoothId: string;
    eventId: string;
    driveFileId: string;
    driveFileUrl: string;
    fileName: string;
    fileType: 'card' | 'brochure';
    mimeType?: string;
    sizeBytes?: number;
    isPublic?: boolean;
  }): Promise<IExhibitorDocument> {
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
    });
    return document.save();
  }

  async listByBooth(boothId: string, fileType?: 'card' | 'brochure'): Promise<IExhibitorDocument[]> {
    const query: Record<string, unknown> = {
      exhibitorBoothId: new mongoose.Types.ObjectId(boothId),
    };
    if (fileType) {
      query.fileType = fileType;
    }
    return ExhibitorDocument.find(query).sort({ createdAt: -1 });
  }

  async findById(docId: string): Promise<IExhibitorDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return null;
    }
    return ExhibitorDocument.findById(new mongoose.Types.ObjectId(docId));
  }

  async deleteById(docId: string): Promise<IExhibitorDocument | null> {
    return ExhibitorDocument.findByIdAndDelete(new mongoose.Types.ObjectId(docId));
  }
}
