import { ExhibitorDocumentRepository } from '@/repository/exhibitorDocument.repository';
import { VisitorScannedBoothRepository } from '@/repository/visitorScannedBooth.repository';
import { IExhibitorDocument } from '@/model/exhibitorDocument.model';
import {
  ListScannedBoothsOptions,
  ListScannedBoothsResult,
  ScannedBoothItem,
} from '@/types/visitor.types';

export class VisitorService {
  constructor(
    private _scannedBoothRepository: VisitorScannedBoothRepository,
    private _docRepository: ExhibitorDocumentRepository
  ) {}

  /**
   * Returns one page of booths the visitor has scanned, newest first.
   *
   * Pagination is cursor-based on the scanned-booth `_id` (an ObjectId, which
   * is monotonically increasing by creation time). The client passes the last
   * item's id back as `cursor` to fetch the next page — no offset/skip, so
   * pages stay cheap as the visitor's history grows.
   *
   * For each booth on the page we also join the booth's public exhibitor
   * documents to surface aggregated contact info (names, emails, etc.) and
   * shared-document metadata in a single response.
   */
  async listVisitorScannedBooths(
    userId: string,
    opts: ListScannedBoothsOptions = {}
  ): Promise<ListScannedBoothsResult> {
    // Clamp page size: default 30, hard floor 1, hard ceiling 100.
    const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);

    // Cheap short-circuit: if the visitor has never scanned anything, skip
    // the page query and the document join entirely.
    const total = await this._scannedBoothRepository.countByVisitor(userId);
    if (total === 0) {
      return { booths: [], nextCursor: null, total: 0 };
    }

    // Page query: { _id: { $lt: cursor } } sorted desc, limit N. Index-backed.
    const page = await this._scannedBoothRepository.listByVisitorWithCursor(userId, {
      cursor: opts.cursor,
      limit,
    });

    // Next cursor = last item's id, but only when the page was full. A short
    // page means we've reached the end and the client should stop scrolling.
    const lastEntry = page[page.length - 1];
    const nextCursor =
      page.length === limit && lastEntry ? lastEntry._id.toString() : null;

    // Batch-fetch every public document for every booth on this page in one
    // query — avoids an N+1 against ExhibitorDocument while we build the
    // response.
    const boothObjectIds = page.map((p) => p.exhibitorBoothId);
    const allDocs = boothObjectIds.length
      ? await this._docRepository.listPublicByBoothIds(boothObjectIds)
      : [];

    // Group documents by booth so each booth's contacts can be aggregated
    // independently in the map() below — O(1) lookup per booth.
    const docsByBoothId = new Map<string, IExhibitorDocument[]>();
    for (const d of allDocs) {
      const key = d.exhibitorBoothId.toString();
      const list = docsByBoothId.get(key) ?? [];
      list.push(d);
      docsByBoothId.set(key, list);
    }

    // VisitorScannedBooth stores only the Drive URLs that were shared with
    // the visitor at scan time; this index lets us hydrate each URL back to
    // its full document (fileName, mimeType, fileType, …) without re-querying.
    const docByUrl = new Map<string, IExhibitorDocument>();
    for (const d of allDocs) {
      if (d.driveFileUrl) docByUrl.set(d.driveFileUrl, d);
    }

    // A booth may have multiple cards/brochures, all extracted by OCR. The
    // same name/email/company often repeats across docs (and case/whitespace
    // can vary), so we dedupe case-insensitively while keeping the first
    // original casing the user actually saw.
    const dedupe = (values: (string | undefined | null)[]): string[] => {
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
    };

    const booths: ScannedBoothItem[] = page.map((entry) => {
      const boothDocs = docsByBoothId.get(entry.exhibitorBoothId.toString()) ?? [];

      // LinkedIn lives in its own field on each doc; other social URLs are an
      // array. Flatten both into a single deduped `socials` list so the FE
      // doesn't have to special-case LinkedIn.
      const socials = dedupe([
        ...boothDocs.map((d) => d.extractedLinkedin),
        ...boothDocs.flatMap((d) => d.extractedSocialMedia ?? []),
      ]);

      return {
        timestamp: entry.createdAt.toISOString(),
        boothName: entry.boothName,
        eventName: entry.eventName,
        qrId: entry.qrId,
        contacts: {
          names: dedupe(boothDocs.map((d) => d.extractedName)),
          companies: dedupe(boothDocs.map((d) => d.extractedCompany)),
          titles: dedupe(boothDocs.map((d) => d.extractedTitle)),
          phones: dedupe(boothDocs.map((d) => d.extractedPhone)),
          emails: dedupe(boothDocs.map((d) => d.extractedEmail)),
          websites: dedupe(boothDocs.map((d) => d.extractedWebsite)),
          socials,
          addresses: dedupe(boothDocs.map((d) => d.extractedAddress)),
        },
        // Hydrate each shared URL into a full document object. If a doc was
        // deleted after the scan, the URL is still returned bare so the FE
        // can show a degraded card instead of crashing.
        sharedDocuments: (entry.sharedDocUrls ?? []).map((url) => {
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
      };
    });

    return { booths, nextCursor, total };
  }
}
