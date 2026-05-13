import { customAlphabet } from 'nanoid';
import { google } from 'googleapis';
import { ExhibitorBoothRepository } from './exhibitorBooth.repository';
import { EventRepository } from '@/features/event/event.repository';
import { AuthRepository } from '@/features/auth/auth.repository';
import { ExhibitorDocumentRepository } from '@/features/exhibitorDocument/exhibitorDocument.repository';
import { ExhibitorDocument } from '@/features/exhibitorDocument/exhibitorDocument.model';
import { ApiError } from '@/shared/utils/ApiError';
import { config } from '@/config/env';
import { CreateExhibitorBoothInput, UpdateExhibitorBoothInput, CreateBoothWithDocumentsInput } from './exhibitorBooth.schema';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { SheetsClient } from '@/shared/google/sheets.client';
import { DriveClient } from '@/shared/google/drive.client';
import { verifyToken } from '@/shared/utils/jwt';
import { anthropic } from '@/config/anthropic';
import { DOCUMENT_EXTRACTION_PROMPT } from '@/features/scan/scan.prompt';

const generateQrId = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  10
);

export class ExhibitorBoothService {
  private repository: ExhibitorBoothRepository;
  private eventRepository: EventRepository;
  private authRepository: AuthRepository;
  private docRepository: ExhibitorDocumentRepository;

  constructor() {
    this.repository = new ExhibitorBoothRepository();
    this.eventRepository = new EventRepository();
    this.authRepository = new AuthRepository();
    this.docRepository = new ExhibitorDocumentRepository();
  }

  async createBooth(userId: string, eventId: string, payload: CreateExhibitorBoothInput) {
    const event = await this.eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }

    const qrId = generateQrId();
    const qrUrl = `${config.PUBLIC_APP_URL}/exhibitor/${qrId}`;

    return this.repository.create({
      ownerUserId: userId,
      eventId,
      boothName: payload.boothName,
      description: payload.description,
      qrId,
      qrUrl,
    });
  }

  async getBooth(userId: string, boothId: string) {
    const booth = await this.repository.findById(boothId);
    if (!booth) {
      throw ApiError.notFound('Exhibitor booth not found');
    }
    if (booth.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this booth');
    }
    return booth;
  }

  async updateBooth(userId: string, boothId: string, payload: UpdateExhibitorBoothInput) {
    await this.getBooth(userId, boothId);

    const updates: Partial<{ boothName: string; description: string }> = {};
    if (payload.boothName !== undefined) updates.boothName = payload.boothName;
    if (payload.description !== undefined) updates.description = payload.description;

    return this.repository.update(boothId, updates);
  }

  async listByEvent(userId: string, eventId: string) {
    const event = await this.eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }
    return this.repository.listByEvent(eventId);
  }

  async getBoothByQrId(qrId: string) {
    const booth = await this.repository.findByQrId(qrId);
    if (!booth) {
      throw ApiError.notFound('Booth not found');
    }
    return booth;
  }

  async checkInVisitor(
    qrId: string,
    visitorData: { name: string; email: string; phone?: string },
    authToken?: string
  ): Promise<{ alreadyCheckedIn: boolean; booth: any }> {
    console.log('[CheckIn] START', { qrId, email: visitorData.email, hasAuthToken: !!authToken });

    const booth = await this.repository.findByQrId(qrId);
    if (!booth) {
      console.log('[CheckIn] FAIL: booth not found for qrId', qrId);
      throw ApiError.notFound('Booth not found');
    }
    console.log('[CheckIn] booth found', { boothId: booth._id.toString(), boothName: booth.boothName, ownerUserId: booth.ownerUserId.toString() });

    const event = await this.eventRepository.findEventById(booth.eventId.toString());
    if (!event) {
      console.log('[CheckIn] FAIL: event not found', booth.eventId.toString());
      throw ApiError.notFound('Event not found');
    }
    console.log('[CheckIn] event found', { eventName: event.name });

    const exhibitor = await this.authRepository.findUserByIdWithRefreshToken(
      booth.ownerUserId.toString()
    );
    if (!exhibitor) {
      console.log('[CheckIn] FAIL: exhibitor user not found', booth.ownerUserId.toString());
      throw new ApiError(412, 'Exhibitor account not found');
    }
    if (!exhibitor.googleRefreshToken) {
      console.log('[CheckIn] FAIL: exhibitor has no googleRefreshToken', { exhibitorId: exhibitor._id });
      throw new ApiError(412, 'Exhibitor has not connected their Google account');
    }
    console.log('[CheckIn] exhibitor found with refresh token');

    // Exhibitor's visitor log sheet
    try {
      console.log('[CheckIn] Step 1/4: ensureVisitorSheetCreated', { visitorSheetCreated: booth.visitorSheetCreated, visitorSheetId: booth.visitorSheetId });
      await this.ensureVisitorSheetCreated(booth, exhibitor.googleRefreshToken);
      console.log('[CheckIn] Step 1/4 OK', { visitorSheetId: booth.visitorSheetId });
    } catch (error) {
      console.error('[CheckIn] Step 1/4 FAIL:', error);
      throw error;
    }

    let exhibitorAlreadyChecked = false;
    try {
      console.log('[CheckIn] Step 2/4: isExhibitorSheetHasEmail', { sheetId: booth.visitorSheetId, email: visitorData.email });
      exhibitorAlreadyChecked = await this.isExhibitorSheetHasEmail(
        booth,
        exhibitor.googleRefreshToken,
        visitorData.email
      );
      console.log('[CheckIn] Step 2/4 OK', { exhibitorAlreadyChecked });
    } catch (error) {
      console.error('[CheckIn] Step 2/4 FAIL:', error);
      throw error;
    }

    if (!exhibitorAlreadyChecked) {
      try {
        console.log('[CheckIn] Step 3/4: appendToExhibitorSheet');
        await this.appendToExhibitorSheet(booth, exhibitor.googleRefreshToken, visitorData);
        await this.repository.incrementScanCount(booth._id.toString());
        console.log('[CheckIn] Step 3/4 OK: appended row + incremented scanCount');
      } catch (error) {
        console.error('[CheckIn] Step 3/4 FAIL:', error);
        throw error;
      }
    } else {
      console.log('[CheckIn] Step 3/4 SKIPPED (already checked in)');
    }

    // Look up booth's public documents — used both for sharing and for sheet column
    const publicDocuments = await ExhibitorDocument.find({
      exhibitorBoothId: booth._id,
      isPublic: true,
    });
    const sharedDocUrls = publicDocuments.map((d) => d.driveFileUrl).filter(Boolean);

    // Share booth's public documents with visitor's email so they show up in their Drive "Shared with me"
    try {
      console.log('[CheckIn] sharing public docs with visitor');
      await this.shareDocumentsWithVisitor(
        publicDocuments,
        exhibitor.googleRefreshToken,
        visitorData.email
      );
      console.log('[CheckIn] doc sharing done');
    } catch (error) {
      console.error('[CheckIn] doc sharing FAIL (non-fatal):', error);
    }

    // Visitor's scanned booths sheet (only if authenticated)
    if (authToken) {
      try {
        console.log('[CheckIn] Step 4/4: visitor sheet update');
        const payload = verifyToken(authToken);
        console.log('[CheckIn] JWT verified', { userId: payload.id, email: payload.email });
        const visitor = await this.authRepository.findUserByIdWithRefreshToken(payload.id);
        if (!visitor) {
          console.log('[CheckIn] WARN: visitor user not found in DB', payload.id);
        } else if (!visitor.googleRefreshToken) {
          console.log('[CheckIn] WARN: visitor has no googleRefreshToken', { visitorId: visitor._id });
        } else {
          console.log('[CheckIn] visitor found with refresh token', { visitorId: visitor._id, visitedBoothsSheetId: visitor.visitedBoothsSheetId });
          const visitorAlreadyScanned = await this.isVisitorBoothAlreadyScanned(
            visitor,
            booth.qrId
          );
          console.log('[CheckIn] visitorAlreadyScanned check', { visitorAlreadyScanned });
          if (!visitorAlreadyScanned) {
            await this.ensureVisitorScannedBoothSheet(visitor);
            console.log('[CheckIn] visitor sheet ensured', { sheetId: visitor.visitedBoothsSheetId });
            await this.appendToVisitorSheet(visitor, booth, event.name, sharedDocUrls);
            console.log('[CheckIn] Step 4/4 OK: appended row to visitor sheet');
          } else {
            console.log('[CheckIn] Step 4/4 SKIPPED (already in visitor sheet)');
          }
        }
      } catch (error) {
        console.error('[CheckIn] Step 4/4 FAIL (non-fatal):', error);
      }
    } else {
      console.log('[CheckIn] Step 4/4 SKIPPED (no authToken)');
    }

    console.log('[CheckIn] DONE', { alreadyCheckedIn: exhibitorAlreadyChecked });
    return {
      alreadyCheckedIn: exhibitorAlreadyChecked,
      booth: {
        boothName: booth.boothName,
        description: booth.description,
        scanCount: exhibitorAlreadyChecked ? booth.scanCount : booth.scanCount + 1,
      },
    };
  }

  private async shareDocumentsWithVisitor(
    documents: any[],
    exhibitorRefreshToken: string,
    visitorEmail: string
  ): Promise<void> {
    console.log('[CheckIn] found public documents to share', { count: documents.length });
    if (documents.length === 0) return;

    const auth = createOAuthClient(exhibitorRefreshToken);
    const drive = google.drive({ version: 'v3', auth: auth as any });

    for (const doc of documents) {
      try {
        await drive.permissions.create({
          fileId: doc.driveFileId,
          sendNotificationEmail: false,
          requestBody: {
            type: 'user',
            role: 'reader',
            emailAddress: visitorEmail,
          },
        });
        console.log('[CheckIn] shared doc', { fileName: doc.fileName, visitorEmail });
      } catch (error: any) {
        // duplicate share is fine — Drive returns 400 if already shared
        if (error?.message?.includes('already')) {
          console.log('[CheckIn] doc already shared with visitor', { fileName: doc.fileName });
        } else {
          console.error('[CheckIn] share failed', { fileName: doc.fileName, message: error?.message });
        }
      }
    }
  }

  private async ensureVisitorSheetCreated(
    booth: any,
    exhibitorRefreshToken: string
  ): Promise<void> {
    if (booth.visitorSheetCreated && booth.visitorSheetId) {
      console.log('[CheckIn] visitor sheet already exists', { sheetId: booth.visitorSheetId });
      return;
    }

    console.log('[CheckIn] creating new visitor sheet for booth', booth.boothName);
    const auth = createOAuthClient(exhibitorRefreshToken);
    const sheetsClient = new SheetsClient(auth);

    const { sheetId, sheetUrl } = await sheetsClient.createSheet(
      `${booth.boothName} - Visitor Log`
    );
    console.log('[CheckIn] sheet created', { sheetId });

    await sheetsClient.addHeaderRow(sheetId, [
      'Timestamp',
      'Visitor Name',
      'Visitor Email',
      'Visitor Phone',
      'Booth Name',
    ]);
    console.log('[CheckIn] header row added');

    await this.repository.updateVisitorSheet(booth._id.toString(), {
      visitorSheetId: sheetId,
      visitorSheetUrl: sheetUrl,
      visitorSheetCreated: true,
    });

    // Mutate in-memory booth so subsequent calls see the new sheet ID
    booth.visitorSheetId = sheetId;
    booth.visitorSheetUrl = sheetUrl;
    booth.visitorSheetCreated = true;
    console.log('[CheckIn] booth in-memory updated with sheetId');
  }

  private async isExhibitorSheetHasEmail(
    booth: any,
    exhibitorRefreshToken: string,
    email: string
  ): Promise<boolean> {
    if (!booth.visitorSheetCreated || !booth.visitorSheetId) return false;

    const auth = createOAuthClient(exhibitorRefreshToken);
    const sheetsClient = new SheetsClient(auth);

    try {
      const rows = await sheetsClient.readRange(
        booth.visitorSheetId,
        'Sheet1!C2:C'
      );
      const emails = rows.flat();
      return emails.includes(email);
    } catch (error) {
      return false;
    }
  }

  private async appendToExhibitorSheet(
    booth: any,
    exhibitorRefreshToken: string,
    visitorData: { name: string; email: string; phone?: string }
  ): Promise<void> {
    const auth = createOAuthClient(exhibitorRefreshToken);
    const sheetsClient = new SheetsClient(auth);

    const timestamp = new Date().toISOString();
    const rowData = [
      timestamp,
      visitorData.name,
      visitorData.email,
      visitorData.phone || '',
      booth.boothName,
    ];

    await sheetsClient.appendRow(booth.visitorSheetId, rowData);
  }

  private async ensureVisitorScannedBoothSheet(visitor: any): Promise<void> {
    if (visitor.visitedBoothsSheetId) return;

    const auth = createOAuthClient(visitor.googleRefreshToken);
    const sheetsClient = new SheetsClient(auth);

    const { sheetId } = await sheetsClient.createSheet('My Scanned Booths');
    await sheetsClient.addHeaderRow(sheetId, [
      'Timestamp',
      'Booth Name',
      'Event',
      'Booth QR ID',
      'Shared Documents',
    ]);

    await this.authRepository.updateUser(visitor._id.toString(), {
      visitedBoothsSheetId: sheetId,
    });

    visitor.visitedBoothsSheetId = sheetId;
  }

  private async isVisitorBoothAlreadyScanned(
    visitor: any,
    boothQrId: string
  ): Promise<boolean> {
    if (!visitor.visitedBoothsSheetId) return false;

    const auth = createOAuthClient(visitor.googleRefreshToken);
    const sheetsClient = new SheetsClient(auth);

    try {
      const rows = await sheetsClient.readRange(
        visitor.visitedBoothsSheetId,
        'Sheet1!D2:D'
      );
      const qrIds = rows.flat();
      return qrIds.includes(boothQrId);
    } catch (error) {
      return false;
    }
  }

  private async appendToVisitorSheet(
    visitor: any,
    booth: any,
    eventName: string,
    sharedDocUrls: string[] = []
  ): Promise<void> {
    const auth = createOAuthClient(visitor.googleRefreshToken);
    const sheetsClient = new SheetsClient(auth);

    const timestamp = new Date().toISOString();
    const rowData = [
      timestamp,
      booth.boothName,
      eventName,
      booth.qrId,
      sharedDocUrls.join(', '),
    ];

    await sheetsClient.appendRow(visitor.visitedBoothsSheetId, rowData);
  }

  async listVisitorScannedBooths(userId: string): Promise<
    Array<{
      timestamp: string;
      boothName: string;
      eventName: string;
      qrId: string;
      sharedDocuments: Array<{
        url: string;
        fileId?: string;
        fileName?: string;
        mimeType?: string;
        fileType?: 'card' | 'brochure';
        thumbnailUrl?: string;
      }>;
    }>
  > {
    const visitor = await this.authRepository.findUserByIdWithRefreshToken(userId);
    if (!visitor) return [];
    if (!visitor.visitedBoothsSheetId || !visitor.googleRefreshToken) return [];

    const auth = createOAuthClient(visitor.googleRefreshToken);
    const sheetsClient = new SheetsClient(auth);

    try {
      const rows = await sheetsClient.readRange(
        visitor.visitedBoothsSheetId,
        'Sheet1!A2:E'
      );

      const parsed = rows
        .filter((row) => Array.isArray(row) && row.length > 0)
        .map((row) => {
          const r = row as unknown[];
          const urls = typeof r[4] === 'string' && r[4]
            ? (r[4] as string).split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          return {
            timestamp: (r[0] as string) ?? '',
            boothName: (r[1] as string) ?? '',
            eventName: (r[2] as string) ?? '',
            qrId: (r[3] as string) ?? '',
            urls,
          };
        })
        .filter((entry) => entry.qrId);

      // Enrich docs with metadata in one query
      const allUrls = Array.from(new Set(parsed.flatMap((p) => p.urls)));
      const docs = allUrls.length
        ? await ExhibitorDocument.find({ driveFileUrl: { $in: allUrls } })
        : [];
      const docByUrl = new Map(docs.map((d) => [d.driveFileUrl, d]));

      return parsed.map((entry) => ({
        timestamp: entry.timestamp,
        boothName: entry.boothName,
        eventName: entry.eventName,
        qrId: entry.qrId,
        sharedDocuments: entry.urls.map((url) => {
          const doc = docByUrl.get(url);
          if (!doc) return { url };
          return {
            url,
            fileId: doc.driveFileId,
            fileName: doc.fileName,
            mimeType: doc.mimeType,
            fileType: doc.fileType,
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${doc.driveFileId}&sz=w400`,
          };
        }),
      }));
    } catch (error) {
      console.error('[ListVisitorScannedBooths] read failed:', error);
      return [];
    }
  }

  async createBoothWithDocuments(
    userId: string,
    eventId: string,
    payload: CreateBoothWithDocumentsInput & { documents: Array<{ rawText: string; fileType: 'card' | 'brochure'; fileName: string }> }
  ) {
    const event = await this.eventRepository.findEventById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found');
    }
    if (event.ownerUserId.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this event');
    }

    const user = await this.authRepository.findUserByIdWithRefreshToken(userId);
    if (!user?.googleRefreshToken) {
      throw new ApiError(412, 'Google account connection required');
    }

    // Create booth
    const qrId = generateQrId();
    const qrUrl = `${config.PUBLIC_APP_URL}/exhibitor/${qrId}`;

    const booth = await this.repository.create({
      ownerUserId: userId,
      eventId,
      boothName: payload.boothName,
      description: payload.description,
      qrId,
      qrUrl,
    });

    let sheetUrl = '';

    try {
      const oauth = createOAuthClient(user.googleRefreshToken);
      const sheetsClient = new SheetsClient(oauth);

      // Create extraction sheet
      const sheetTitle = `${booth.boothName} - Document Extractions`;
      const { sheetId, sheetUrl: newSheetUrl } = await sheetsClient.createSheet(sheetTitle);
      sheetUrl = newSheetUrl;

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

      await this.repository.updateDocExtractSheet(booth._id.toString(), {
        docExtractSheetId: sheetId,
        docExtractSheetUrl: newSheetUrl,
        docExtractSheetCreated: true,
      });

      // Process documents
      const processedDocs = [];

      for (const doc of payload.documents) {
        try {
          // Extract and structure text
          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: `${DOCUMENT_EXTRACTION_PROMPT}\n\nOCR Text:\n${doc.rawText}`,
              },
            ],
          });

          const textContent = response.content.find((c) => c.type === 'text');
          if (!textContent || textContent.type !== 'text') {
            throw new ApiError(502, 'Anthropic API returned unexpected response');
          }

          let cleanText = textContent.text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanText);

          // Create document in DB
          const createdDoc = await this.docRepository.create({
            ownerUserId: userId,
            exhibitorBoothId: booth._id.toString(),
            eventId,
            driveFileId: '', // No file upload in this flow
            driveFileUrl: '', // These would be filled if we uploaded to Drive
            fileName: doc.fileName,
            fileType: doc.fileType,
            extractedText: doc.rawText,
            extractedName: parsed.name || undefined,
            extractedCompany: parsed.company || undefined,
            extractedTitle: parsed.title || undefined,
            extractedPhone: parsed.phone || undefined,
            extractedEmail: parsed.email || undefined,
            extractedWebsite: parsed.website || undefined,
            extractedAddress: parsed.address || undefined,
            extractionStatus: 'success',
            isPublic: false,
          });

          // Append to sheet
          await sheetsClient.appendRow(sheetId, [
            new Date().toISOString(),
            doc.fileName,
            doc.fileType,
            parsed.name || '',
            parsed.company || '',
            parsed.title || '',
            parsed.phone || '',
            parsed.email || '',
            parsed.website || '',
            parsed.address || '',
            doc.rawText.substring(0, 500),
          ]);

          processedDocs.push({
            id: createdDoc._id,
            fileName: createdDoc.fileName,
            fileType: createdDoc.fileType,
            extractedName: createdDoc.extractedName,
            extractedCompany: createdDoc.extractedCompany,
            extractedEmail: createdDoc.extractedEmail,
            extractedPhone: createdDoc.extractedPhone,
            extractedTitle: createdDoc.extractedTitle,
            extractedWebsite: createdDoc.extractedWebsite,
            extractedAddress: createdDoc.extractedAddress,
          });
        } catch (err) {
          console.error('[CreateBoothWithDocuments] Document processing error:', err);
          // Continue processing other documents
        }
      }

      return {
        booth: {
          id: booth._id,
          boothName: booth.boothName,
          description: booth.description,
          qrId: booth.qrId,
          qrUrl: booth.qrUrl,
        },
        documents: processedDocs,
        sheetUrl,
      };
    } catch (error) {
      // Clean up booth if sheet creation fails
      if (error instanceof ApiError && error.statusCode === 412) {
        throw error;
      }
      throw new ApiError(502, 'Failed to create booth with documents', { originalError: error instanceof Error ? error.message : 'Unknown' });
    }
  }
}
