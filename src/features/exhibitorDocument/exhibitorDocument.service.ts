import { ExhibitorDocumentRepository } from './exhibitorDocument.repository';
import { ExhibitorBoothRepository } from '@/features/exhibitorBooth/exhibitorBooth.repository';
import { ApiError } from '@/shared/utils/ApiError';
import {
  CreateExhibitorDocumentInput,
  ListExhibitorDocumentsQuery,
} from './exhibitorDocument.schema';

export class ExhibitorDocumentService {
  private repository: ExhibitorDocumentRepository;
  private boothRepository: ExhibitorBoothRepository;

  constructor() {
    this.repository = new ExhibitorDocumentRepository();
    this.boothRepository = new ExhibitorBoothRepository();
  }

  private async assertBoothOwnership(userId: string, boothId: string) {
    const booth = await this.boothRepository.findById(boothId);
    if (!booth) {
      throw ApiError.notFound('Exhibitor booth not found');
    }
    if (booth.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this booth');
    }
    return booth;
  }

  async createDocument(userId: string, boothId: string, payload: CreateExhibitorDocumentInput) {
    const booth = await this.assertBoothOwnership(userId, boothId);

    const document = await this.repository.create({
      ownerUserId: userId,
      exhibitorBoothId: boothId,
      eventId: booth.eventId.toString(),
      driveFileId: payload.driveFileId,
      driveFileUrl: payload.driveFileUrl,
      fileName: payload.fileName,
      fileType: payload.fileType,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      isPublic: payload.isPublic,
    });

    await this.boothRepository.incrementDocumentCount(boothId);

    return document;
  }

  async listByBooth(userId: string, boothId: string, query: ListExhibitorDocumentsQuery = {}) {
    await this.assertBoothOwnership(userId, boothId);
    return this.repository.listByBooth(boothId, query.fileType);
  }

  async deleteDocument(userId: string, boothId: string, docId: string) {
    await this.assertBoothOwnership(userId, boothId);

    const document = await this.repository.findById(docId);
    if (!document) {
      throw ApiError.notFound('Document not found');
    }
    if (document.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this document');
    }
    if (document.exhibitorBoothId.toString() !== boothId) {
      throw ApiError.notFound('Document not found');
    }

    await this.repository.deleteById(docId);
    await this.boothRepository.decrementDocumentCount(boothId);

    return { id: docId };
  }
}
