import { ExhibitorDocumentRepository } from './exhibitorDocument.repository';
import { ExhibitorBoothRepository } from '@/features/exhibitorBooth/exhibitorBooth.repository';
import { AuthRepository } from '@/features/auth/auth.repository';
import { ApiError } from '@/shared/utils/ApiError';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { DriveClient } from '@/shared/google/drive.client';
import {
  CreateExhibitorDocumentInput,
  ListExhibitorDocumentsQuery,
} from './exhibitorDocument.schema';

export class ExhibitorDocumentService {
  private repository: ExhibitorDocumentRepository;
  private boothRepository: ExhibitorBoothRepository;
  private authRepository: AuthRepository;
  private driveClient: DriveClient;

  constructor() {
    this.repository = new ExhibitorDocumentRepository();
    this.boothRepository = new ExhibitorBoothRepository();
    this.authRepository = new AuthRepository();
    this.driveClient = new DriveClient(null as any);
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

    if (payload.isPublic) {
      const user = await this.authRepository.findUserByIdWithRefreshToken(userId);
      if (user?.googleRefreshToken) {
        try {
          const oauth = createOAuthClient(user.googleRefreshToken);
          await this.driveClient.setPublicPermission(oauth, payload.driveFileId);
        } catch (error) {
          console.error('[ExhibitorDocumentService] Failed to set public permission:', error);
        }
      }
    }

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
