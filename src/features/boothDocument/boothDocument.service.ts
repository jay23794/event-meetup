import { BoothDocumentRepository } from './boothDocument.repository';
import { BoothRepository } from '@/features/booth/booth.repository';
import { ApiError } from '@/shared/utils/ApiError';
import { CreateBoothDocumentInput, ListBoothDocumentsQuery } from './boothDocument.schema';

export class BoothDocumentService {
  private repository: BoothDocumentRepository;
  private boothRepository: BoothRepository;

  constructor() {
    this.repository = new BoothDocumentRepository();
    this.boothRepository = new BoothRepository();
  }

  async createDocument(userId: string, boothId: string, data: CreateBoothDocumentInput) {
    const booth = await this.boothRepository.findBoothById(boothId);

    if (!booth) {
      throw ApiError.notFound('Booth not found');
    }
    if (booth.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this booth');
    }

    const document = await this.repository.createDocument({
      ownerUserId: userId,
      boothId,
      eventId: booth.eventId.toString(),
      driveFileId: data.driveFileId,
      driveFileUrl: data.driveFileUrl,
      fileName: data.fileName,
      fileType: data.fileType,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      isPublic: data.isPublic,
      extractedText: data.extractedText,
    });

    return {
      _id: document._id,
      fileName: document.fileName,
      fileType: document.fileType,
      driveFileUrl: document.driveFileUrl,
      createdAt: document.createdAt,
    };
  }

  async listByBooth(userId: string, boothId: string, query: ListBoothDocumentsQuery) {
    const booth = await this.boothRepository.findBoothById(boothId);

    if (!booth) {
      throw ApiError.notFound('Booth not found');
    }
    if (booth.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this booth');
    }

    const documents = await this.repository.findByBoothId(boothId, query.fileType);

    return {
      documents: documents.map((doc) => ({
        _id: doc._id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        driveFileUrl: doc.driveFileUrl,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        isPublic: doc.isPublic,
        extractedText: doc.extractedText,
        createdAt: doc.createdAt,
      })),
      total: documents.length,
    };
  }

  async deleteDocument(userId: string, docId: string) {
    const document = await this.repository.findById(docId);

    if (!document) {
      throw ApiError.notFound('Document not found');
    }
    if (document.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this document');
    }

    await this.repository.deleteById(docId);

    return {
      message: 'Document deleted successfully',
    };
  }
}
