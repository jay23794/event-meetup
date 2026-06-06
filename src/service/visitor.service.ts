import { ExhibitorDocument } from "@/model/exhibitorDocument.model";
import { VisitorScannedBooth } from "@/model/visitorScannedBooth.model";
import mongoose from "mongoose";

export class VisitorService{
    constructor(){
        
    }
      async listVisitorScannedBooths(
        userId: string,
        opts: { limit?: number; cursor?: number } = {}
      ): Promise<{
        booths: Array<{
          timestamp: string;
          boothName: string;
          eventName: string;
          qrId: string;
          contacts: {
            names: string[];
            companies: string[];
            titles: string[];
            phones: string[];
            emails: string[];
            websites: string[];
            socials: string[];
            addresses: string[];
          };
          sharedDocuments: Array<{
            url: string;
            fileId?: string;
            fileName?: string;
            mimeType?: string;
            fileType?: 'card' | 'brochure';
            thumbnailUrl?: string;
          }>;
        }>;
        nextCursor: number | null;
        total: number;
      }> {
        const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);
        const cursor = Math.max(opts.cursor ?? 0, 0);
    
        const visitorObjId = new mongoose.Types.ObjectId(userId);
    
        const total = await VisitorScannedBooth.countDocuments({ visitorUserId: visitorObjId });
        if (total === 0) {
          return { booths: [], nextCursor: null, total: 0 };
        }
    
        const page = await VisitorScannedBooth.find({ visitorUserId: visitorObjId })
          .sort({ createdAt: -1 })
          .skip(cursor)
          .limit(limit)
          .lean();
    
        const nextCursor = cursor + page.length < total ? cursor + page.length : null;
    
        const boothObjectIds = page.map((p) => p.exhibitorBoothId);
        const allDocs = boothObjectIds.length
          ? await ExhibitorDocument.find({
              exhibitorBoothId: { $in: boothObjectIds },
              isPublic: true,
            })
          : [];
    
        const docsByBoothId = new Map<string, typeof allDocs>();
        for (const d of allDocs) {
          const key = d.exhibitorBoothId.toString();
          const list = docsByBoothId.get(key) ?? [];
          list.push(d);
          docsByBoothId.set(key, list);
        }
    
        const docByUrl = new Map<string, (typeof allDocs)[number]>();
        for (const d of allDocs) {
          if (d.driveFileUrl) docByUrl.set(d.driveFileUrl, d);
        }
    
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
    
        const booths = page.map((entry) => {
          const boothDocs = docsByBoothId.get(entry.exhibitorBoothId.toString()) ?? [];
    
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