import { ExhibitorDocumentRepository } from './exhibitorDocument.repository';
import { ExhibitorBoothRepository } from '@/features/exhibitorBooth/exhibitorBooth.repository';
import { ApiError } from '@/shared/utils/ApiError';
import { ListExhibitorDocumentsQuery } from './exhibitorDocument.schema';

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

  async listByBooth(userId: string, boothId: string, query: ListExhibitorDocumentsQuery = {}) {
    await this.assertBoothOwnership(userId, boothId);
    return this.repository.listByBooth(boothId, query.fileType);
  }
}
