import { google } from 'googleapis';
import { ExhibitorDocumentRepository } from '@/repository/exhibitorDocument.repository';
import { VisitorScannedBoothRepository } from '@/repository/visitorScannedBooth.repository';
import { VisitorCheckInRepository } from '@/repository/visitorCheckIn.repository';
import { ExhibitorBoothRepository } from '@/repository/exhibitorBooth.repository';
import { EventRepository } from '@/repository/event.repository';
import { AuthRepository } from '@/repository/auth.repository';
import { IExhibitorDocument } from '@/model/exhibitorDocument.model';
import {
  ListScannedBoothsOptions,
  ListScannedBoothsResult,
  ScannedBoothContacts,
  ScannedBoothItem,
  SharedDocument,
} from '@/types/visitor.types';
import { IVisitorScannedBooth } from '@/model/visitorScannedBooth.model';
import { ApiError } from '@/errors/ApiError';
import { verifyToken } from '@/utils/jwt';
import { createOAuthClient } from '@/libs/oauth.client';
import { DriveClient } from '@/libs/drive.client';

export class VisitorService {
  constructor(
    private _scannedBoothRepository: VisitorScannedBoothRepository,
    private _docRepository: ExhibitorDocumentRepository,
    private _boothRepository: ExhibitorBoothRepository,
    private _eventRepository: EventRepository,
    private _authRepository: AuthRepository,
    private _checkInRepository: VisitorCheckInRepository
  ) {}

  /**
   * Returns one page of booths the visitor has scanned, newest first.
   *
   * Pagination is cursor-based on the scanned-booth `_id` (an ObjectId, which
   * is monotonically increasing by creation time). The client passes the last
   * item's id back as `cursor` to fetch the next page — no offset/skip, so
   * pages stay cheap as the visitor's history grows.
   */
  async listVisitorScannedBooths(
    userId: string,
    opts: ListScannedBoothsOptions = {}
  ): Promise<ListScannedBoothsResult> {
    const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);

    const total = await this._scannedBoothRepository.countByVisitor(userId);
    if (total === 0) {
      return { booths: [], nextCursor: null, total: 0 };
    }

    const page = await this._scannedBoothRepository.listByVisitorWithCursor(userId, {
      cursor: opts.cursor,
      limit,
    });

    const lastEntry = page[page.length - 1];
    const nextCursor =
      page.length === limit && lastEntry ? lastEntry._id.toString() : null;

    const { docsByBoothId, docByUrl } = await this.loadBoothDocuments(page);

    const booths: ScannedBoothItem[] = page.map((entry) =>
      this.buildBoothItem(
        entry,
        docsByBoothId.get(entry.exhibitorBoothId.toString()) ?? [],
        docByUrl
      )
    );

    return { booths, nextCursor, total };
  }

  /**
   * Records a visitor's scan of a booth.
   *
   * The visitor is the actor here — they scan a QR, optionally signed in. We:
   *   1. resolve booth → event → exhibitor (need exhibitor's refresh token to
   *      share Drive files later)
   *   2. write the exhibitor-side check-in row (deduped on boothId+email)
   *   3. bump the booth's scan count when this is a fresh check-in
   *   4. share the booth's public Drive files with the signed-in visitor
   *      (best-effort, non-fatal)
   *   5. upsert the visitor-owned scanned-booth record (best-effort)
   */
  async checkInVisitor(
    qrId: string,
    visitorData: { name: string; email: string; phone?: string },
    authToken?: string
  ): Promise<{ alreadyCheckedIn: boolean; booth: { boothName: string; description: string; scanCount: number } }> {
    const booth = await this._boothRepository.findByQrId(qrId);
    if (!booth) throw ApiError.notFound('Booth not found');

    const event = await this._eventRepository.findEventById(booth.eventId.toString());
    if (!event) throw ApiError.notFound('Event not found');

    const exhibitor = await this._authRepository.findUserByIdWithRefreshToken(
      booth.ownerUserId.toString()
    );
    if (!exhibitor) throw new ApiError(412, 'Exhibitor account not found');

    // JWT is optional — anonymous scans are allowed, they just skip the
    // Drive share and the visitor-history upsert.
    let visitorUserId: string | undefined;
    if (authToken) {
      try {
        const payload = verifyToken(authToken);
        visitorUserId = payload.id;
      } catch {
        // ignore — treat as anonymous
      }
    }

    const { alreadyCheckedIn } = await this._checkInRepository.create({
      exhibitorBoothId: booth._id,
      eventId: booth.eventId,
      visitorUserId,
      name: visitorData.name,
      email: visitorData.email,
      phone: visitorData.phone,
    });

    if (!alreadyCheckedIn) {
      await this._boothRepository.incrementScanCount(booth._id.toString());
    }

    const publicDocuments = await this._docRepository.listPublicByBoothId(booth._id);
    const sharedDocUrls = publicDocuments
      .map((d) => d.driveFileUrl)
      .filter((url): url is string => !!url);

    // Drive share: only meaningful for signed-in visitors with a Google
    // refresh token on the exhibitor side. Failures here must not block the
    // check-in response.
    if (visitorUserId && exhibitor.googleRefreshToken && publicDocuments.length > 0) {
      try {
        await this.shareDocumentsWithVisitor(
          publicDocuments,
          exhibitor.googleRefreshToken,
          visitorUserId,
          visitorData.email
        );
      } catch (error) {
        console.error('[CheckIn] doc sharing FAIL (non-fatal):', error);
      }
    }

    // Visitor-owned history record. Also best-effort — losing it would only
    // hide this scan from the visitor's "My Scanned Booths" list.
    if (visitorUserId) {
      try {
        await this._scannedBoothRepository.upsertOne({
          visitorUserId,
          exhibitorBoothId: booth._id,
          qrId: booth.qrId,
          boothName: booth.boothName,
          eventName: event.name,
          sharedDocUrls,
        });
      } catch (error) {
        console.error('[CheckIn] visitor scanned-booth record FAIL (non-fatal):', error);
      }
    }

    return {
      alreadyCheckedIn,
      booth: {
        boothName: booth.boothName,
        description: booth.description,
        scanCount: alreadyCheckedIn ? booth.scanCount : booth.scanCount + 1,
      },
    };
  }

  /**
   * Grants the visitor read permission on each Drive file (via the exhibitor's
   * OAuth client) and creates a shortcut to it in the visitor's "shared
   * booths" folder (via the visitor's OAuth client). Lazily provisions both
   * Drive folders if missing and persists the new ids on the visitor.
   */
  private async shareDocumentsWithVisitor(
    documents: IExhibitorDocument[],
    exhibitorRefreshToken: string,
    visitorUserId: string,
    visitorEmail: string
  ): Promise<void> {
    if (documents.length === 0) return;

    const visitor = await this._authRepository.findVisitorByIdForDriveShare(visitorUserId);
    if (!visitor?.googleRefreshToken) {
      console.log('[CheckIn] visitor has no Google refresh token — skipping share');
      return;
    }

    const visitorAuth = createOAuthClient(visitor.googleRefreshToken);
    const driveClient = new DriveClient(visitorAuth);

    let rootFolderId = visitor.meetSyncRootFolderId;
    if (!rootFolderId) {
      rootFolderId = await driveClient.ensureFolder(visitorAuth, 'MeetSync', null);
    }
    let sharedFolderId = visitor.visitedBoothsFolderId;
    if (!sharedFolderId) {
      sharedFolderId = await driveClient.ensureSharedBoothsFolder(visitorAuth, rootFolderId);
    }
    if (
      rootFolderId !== visitor.meetSyncRootFolderId ||
      sharedFolderId !== visitor.visitedBoothsFolderId
    ) {
      await this._authRepository.updateFolderIdsById(visitor._id.toString(), {
        meetSyncRootFolderId: rootFolderId,
        visitedBoothsFolderId: sharedFolderId,
      });
    }

    const exhibitorAuth = createOAuthClient(exhibitorRefreshToken);
    const exhibitorDrive = google.drive({ version: 'v3', auth: exhibitorAuth as any });

    for (const doc of documents) {
      if (!doc.driveFileId) continue;
      try {
        await exhibitorDrive.permissions.create({
          fileId: doc.driveFileId,
          sendNotificationEmail: false,
          requestBody: {
            type: 'user',
            role: 'reader',
            emailAddress: visitorEmail,
          },
        });
      } catch (error: any) {
        // "already" = permission already exists, which is the desired state.
        if (!error?.message?.includes('already')) {
          console.error('[CheckIn] permission grant failed', {
            fileName: doc.fileName,
            message: error?.message,
          });
          continue;
        }
      }

      try {
        const existing = await driveClient.findShortcutToTarget(
          visitorAuth,
          doc.driveFileId,
          sharedFolderId
        );
        if (!existing) {
          await driveClient.createShortcutToFile(
            visitorAuth,
            doc.driveFileId,
            doc.fileName,
            sharedFolderId
          );
        }
      } catch (error: any) {
        console.error('[CheckIn] shortcut create failed', {
          fileName: doc.fileName,
          message: error?.message,
        });
      }
    }
  }

  /**
   * Batch-fetch every public document for every booth on this page in one
   * query (avoids N+1) and build two indexes:
   *   - `docsByBoothId` for per-booth contact aggregation
   *   - `docByUrl` for hydrating the stored share URLs back to full docs
   */
  private async loadBoothDocuments(page: IVisitorScannedBooth[]): Promise<{
    docsByBoothId: Map<string, IExhibitorDocument[]>;
    docByUrl: Map<string, IExhibitorDocument>;
  }> {
    const boothObjectIds = page.map((p) => p.exhibitorBoothId);
    const allDocs = boothObjectIds.length
      ? await this._docRepository.listPublicByBoothIds(boothObjectIds)
      : [];

    const docsByBoothId = new Map<string, IExhibitorDocument[]>();
    const docByUrl = new Map<string, IExhibitorDocument>();
    for (const d of allDocs) {
      const key = d.exhibitorBoothId.toString();
      const list = docsByBoothId.get(key) ?? [];
      list.push(d);
      docsByBoothId.set(key, list);
      if (d.driveFileUrl) docByUrl.set(d.driveFileUrl, d);
    }
    return { docsByBoothId, docByUrl };
  }

  private buildBoothItem(
    entry: IVisitorScannedBooth,
    boothDocs: IExhibitorDocument[],
    docByUrl: Map<string, IExhibitorDocument>
  ): ScannedBoothItem {
    return {
      timestamp: entry.createdAt.toISOString(),
      boothName: entry.boothName,
      eventName: entry.eventName,
      qrId: entry.qrId,
      contacts: this.aggregateContacts(boothDocs),
      sharedDocuments: this.hydrateSharedDocuments(entry.sharedDocUrls, docByUrl),
    };
  }

  /**
   * A booth may have multiple cards/brochures, all extracted by OCR — the
   * same name/email/company often repeats across docs. We dedupe each field
   * across the booth's docs so the FE shows a single clean list per type.
   *
   * LinkedIn lives in its own column on each doc; other social URLs are an
   * array. They're flattened into one `socials` list so the FE doesn't have
   * to special-case LinkedIn.
   */
  private aggregateContacts(boothDocs: IExhibitorDocument[]): ScannedBoothContacts {
    return {
      names: this.dedupe(boothDocs.map((d) => d.extractedName)),
      companies: this.dedupe(boothDocs.map((d) => d.extractedCompany)),
      titles: this.dedupe(boothDocs.map((d) => d.extractedTitle)),
      phones: this.dedupe(boothDocs.map((d) => d.extractedPhone)),
      emails: this.dedupe(boothDocs.map((d) => d.extractedEmail)),
      websites: this.dedupe(boothDocs.map((d) => d.extractedWebsite)),
      socials: this.dedupe([
        ...boothDocs.map((d) => d.extractedLinkedin),
        ...boothDocs.flatMap((d) => d.extractedSocialMedia ?? []),
      ]),
      addresses: this.dedupe(boothDocs.map((d) => d.extractedAddress)),
    };
  }

  /**
   * Resolve each stored share URL back to its full document metadata. If a
   * doc was deleted after the scan, the URL is still returned bare so the FE
   * can show a degraded card instead of crashing.
   */
  private hydrateSharedDocuments(
    urls: string[] | undefined,
    docByUrl: Map<string, IExhibitorDocument>
  ): SharedDocument[] {
    return (urls ?? []).map((url) => {
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
    });
  }

  /**
   * Case-insensitive dedupe that preserves the first original casing and
   * drops null/undefined/empty/whitespace-only values.
   */
  private dedupe(values: (string | undefined | null)[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of values) {
      if (!raw) continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
    }
    return out;
  }
}
