import { customAlphabet } from 'nanoid';
import { google } from 'googleapis';
import { ExhibitorBoothRepository } from './exhibitorBooth.repository';
import { EventRepository } from '@/features/event/event.repository';
import { AuthRepository } from '@/features/auth/auth.repository';
import { ExhibitorDocument } from '@/features/exhibitorDocument/exhibitorDocument.model';
import { ApiError } from '@/shared/utils/ApiError';
import { config } from '@/config/env';
import { CreateExhibitorBoothInput, UpdateExhibitorBoothInput } from './exhibitorBooth.schema';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { SheetsClient } from '@/shared/google/sheets.client';
import { verifyToken } from '@/shared/utils/jwt';

const generateQrId = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  10
);

export class ExhibitorBoothService {
  private repository: ExhibitorBoothRepository;
  private eventRepository: EventRepository;
  private authRepository: AuthRepository;

  constructor() {
    this.repository = new ExhibitorBoothRepository();
    this.eventRepository = new EventRepository();
    this.authRepository = new AuthRepository();
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

    // Share booth's public documents with visitor's email so they show up in their Drive "Shared with me"
    try {
      console.log('[CheckIn] sharing public docs with visitor');
      await this.shareDocumentsWithVisitor(
        booth._id.toString(),
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
            await this.appendToVisitorSheet(visitor, booth, event.name);
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
    boothId: string,
    exhibitorRefreshToken: string,
    visitorEmail: string
  ): Promise<void> {
    const documents = await ExhibitorDocument.find({
      exhibitorBoothId: boothId,
      isPublic: true,
    });

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
    eventName: string
  ): Promise<void> {
    const auth = createOAuthClient(visitor.googleRefreshToken);
    const sheetsClient = new SheetsClient(auth);

    const timestamp = new Date().toISOString();
    const rowData = [
      timestamp,
      booth.boothName,
      eventName,
      booth.qrId,
    ];

    await sheetsClient.appendRow(visitor.visitedBoothsSheetId, rowData);
  }
}
