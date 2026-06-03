import { ExhibitorDocumentRepository, exhibitorDocumentRepository } from '@/repository/exhibitorDocument.repository';
import { ExhibitorBoothRepository, exhibitorBoothRepository } from '@/repository/exhibitorBooth.repository';
import { ApiError } from '@/errors/ApiError';
import { ListExhibitorDocumentsQuery } from '@/types/zod/exhibitorDocument.schema';

export class ExhibitorDocumentService {
  constructor(
    private _repository: ExhibitorDocumentRepository,
    private _boothRepository: ExhibitorBoothRepository = exhibitorBoothRepository
  ) {}

  private async assertBoothOwnership(userId: string, boothId: string) {
    const booth = await this._boothRepository.findById(boothId);
    if (!booth) {
      throw ApiError.notFound('Exhibitor booth not found');
    }
    if (booth.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this booth');
    }
    return booth;
  }

  async listByBooth(userId: string, boothId: string, query: ListExhibitorDocumentsQuery = {}) {
    await this.assertBoothOwnership(userId, boothId);
    return this._repository.listByBooth(boothId, query.fileType);
  }
}

export const exhibitorDocumentService = new ExhibitorDocumentService(exhibitorDocumentRepository);


