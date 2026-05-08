import { BoothDocument, IBoothDocument } from './boothDocument.model';
import { BoothDocumentData } from './boothDocument.types';
import mongoose from 'mongoose';

export class BoothDocumentRepository {
  async createDocument(data: BoothDocumentData): Promise<IBoothDocument> {
    const document = new BoothDocument({
      ownerUserId: new mongoose.Types.ObjectId(data.ownerUserId),
      boothId: new mongoose.Types.ObjectId(data.boothId),
      eventId: new mongoose.Types.ObjectId(data.eventId),
      driveFileId: data.driveFileId,
      driveFileUrl: data.driveFileUrl,
      fileName: data.fileName,
      fileType: data.fileType,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      isPublic: data.isPublic ?? false,
      extractedText: data.extractedText,
    });
    return document.save();
  }

  async findById(docId: string): Promise<IBoothDocument | null> {
    return BoothDocument.findById(new mongoose.Types.ObjectId(docId));
  }

  async findByBoothId(boothId: string, fileType?: string): Promise<IBoothDocument[]> {
    const query: Record<string, any> = { boothId: new mongoose.Types.ObjectId(boothId) };
    if (fileType) {
      query.fileType = fileType;
    }
    return BoothDocument.find(query).sort({ createdAt: -1 });
  }

  async deleteById(docId: string): Promise<IBoothDocument | null> {
    return BoothDocument.findByIdAndDelete(new mongoose.Types.ObjectId(docId));
  }
}
