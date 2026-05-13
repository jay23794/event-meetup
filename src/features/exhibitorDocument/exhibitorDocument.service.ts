import { ExhibitorDocumentRepository } from './exhibitorDocument.repository';
import { ExhibitorBoothRepository } from '@/features/exhibitorBooth/exhibitorBooth.repository';
import { AuthRepository } from '@/features/auth/auth.repository';
import { ApiError } from '@/shared/utils/ApiError';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { DriveClient } from '@/shared/google/drive.client';
import { SheetsClient } from '@/shared/google/sheets.client';
import { anthropic } from '@/config/anthropic';
import { DOCUMENT_EXTRACTION_PROMPT } from '@/features/scan/scan.prompt';
import {
  CreateExhibitorDocumentInput,
  ListExhibitorDocumentsQuery,
  ExtractDocumentInput,
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

  async extractAndSave(userId: string, boothId: string, docId: string, payload: ExtractDocumentInput) {
    const booth = await this.assertBoothOwnership(userId, boothId);

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

    try {
      // Call Anthropic to structure the extracted text
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${DOCUMENT_EXTRACTION_PROMPT}\n\nOCR Text:\n${payload.rawText}`,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new ApiError(502, 'Anthropic API returned unexpected response');
      }

      let cleanText = textContent.text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      const extractedData = {
        extractedText: payload.rawText,
        extractedName: parsed.name || undefined,
        extractedCompany: parsed.company || undefined,
        extractedTitle: parsed.title || undefined,
        extractedPhone: parsed.phone || undefined,
        extractedEmail: parsed.email || undefined,
        extractedWebsite: parsed.website || undefined,
        extractedAddress: parsed.address || undefined,
        extractionStatus: 'success' as const,
      };

      // Update document with extracted data
      const updatedDocument = await this.repository.updateById(docId, extractedData);
      if (!updatedDocument) {
        throw ApiError.notFound('Document not found');
      }

      // Sheet sync — lazy init pattern
      const user = await this.authRepository.findUserByIdWithRefreshToken(userId);
      if (!user?.googleRefreshToken) {
        // No refresh token — extraction succeeded but can't sync to sheets
        console.warn('[ExhibitorDocumentService] No Google refresh token, skipping sheet sync');
        return updatedDocument;
      }

      // Create sheet if not exists
      if (!booth.docExtractSheetCreated) {
        const oauth = createOAuthClient(user.googleRefreshToken);
        const sheetsClient = new SheetsClient(oauth);

        const sheetTitle = `${booth.boothName} - Document Extractions`;
        const { sheetId, sheetUrl } = await sheetsClient.createSheet(sheetTitle);

        await sheetsClient.addHeaderRow(sheetId, [
          'Timestamp',
          'File Name',
          'File Type',
          'Name',
          'Company',
          'Title',
          'Phone',
          'Email',
          'Website',
          'Address',
          'Raw Text',
        ]);

        await this.boothRepository.updateDocExtractSheet(boothId, {
          docExtractSheetId: sheetId,
          docExtractSheetUrl: sheetUrl,
          docExtractSheetCreated: true,
        });

        booth.docExtractSheetId = sheetId;
        booth.docExtractSheetCreated = true;
      }

      // Append row to sheet
      if (booth.docExtractSheetId) {
        const oauth = createOAuthClient(user.googleRefreshToken);
        const sheetsClient = new SheetsClient(oauth);

        await sheetsClient.appendRow(booth.docExtractSheetId, [
          new Date().toISOString(),
          document.fileName,
          document.fileType,
          extractedData.extractedName || '',
          extractedData.extractedCompany || '',
          extractedData.extractedTitle || '',
          extractedData.extractedPhone || '',
          extractedData.extractedEmail || '',
          extractedData.extractedWebsite || '',
          extractedData.extractedAddress || '',
          payload.rawText.substring(0, 500), // Limit raw text to avoid cell overflow
        ]);
      }

      return updatedDocument;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof SyntaxError) {
        await this.repository.updateById(docId, { extractionStatus: 'failed' });
        throw new ApiError(502, 'Failed to parse Anthropic response', { code: 'INVALID_JSON' });
      }
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        throw new ApiError(412, 'Reconnect Google account', { code: 'GOOGLE_AUTH_EXPIRED' });
      }
      await this.repository.updateById(docId, { extractionStatus: 'failed' });
      throw new ApiError(502, 'Document extraction failed', { code: 'EXTRACTION_ERROR' });
    }
  }
}
