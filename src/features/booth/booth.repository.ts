import mongoose from 'mongoose';
import { Booth, IBooth, IBoothScan } from './booth.model';
import { BoothRow } from './booth.types';

export class BoothRepository {
  async createBooth(boothData: {
    ownerUserId: string;
    eventId: string;
    boothName?: string;
    description?: string;
    qrId: string;
    qrUrl: string;
    scans: IBoothScan[];
    scanCount: number;
    voiceTranscript?: string;
    voiceDurationSec?: number;
    hasVoiceNote: boolean;
    names: string[];
    phones: string[];
    emails: string[];
    companies: string[];
    websites: string[];
    linkedinUrls: string[];
    socialMediaUrls: string[];
    imageUrls: string[];
  }): Promise<IBooth> {
    const booth = new Booth({
      ownerUserId: new mongoose.Types.ObjectId(boothData.ownerUserId),
      eventId: new mongoose.Types.ObjectId(boothData.eventId),
      boothName: boothData.boothName,
      description: boothData.description,
      qrId: boothData.qrId,
      qrUrl: boothData.qrUrl,
      scans: boothData.scans,
      scanCount: boothData.scanCount,
      voiceTranscript: boothData.voiceTranscript,
      voiceDurationSec: boothData.voiceDurationSec,
      hasVoiceNote: boothData.hasVoiceNote,
      names: boothData.names,
      phones: boothData.phones,
      emails: boothData.emails,
      companies: boothData.companies,
      websites: boothData.websites,
      linkedinUrls: boothData.linkedinUrls,
      socialMediaUrls: boothData.socialMediaUrls,
      imageUrls: boothData.imageUrls,
    });
    return booth.save();
  }

  async findBoothsByEvent(eventId: string): Promise<IBooth[]> {
    return Booth.find({ eventId: new mongoose.Types.ObjectId(eventId) }).sort({ createdAt: -1 });
  }

  async findBoothById(boothId: string): Promise<IBooth | null> {
    if (!mongoose.Types.ObjectId.isValid(boothId)) return null;
    return Booth.findById(new mongoose.Types.ObjectId(boothId));
  }

  async listBoothsPaged(
    eventId: string,
    cursor: string | undefined,
    limit: number
  ): Promise<{ booths: BoothRow[]; nextCursor: string | null }> {
    const filter: Record<string, unknown> = {
      eventId: new mongoose.Types.ObjectId(eventId),
    };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const docs = await Booth.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;

    const booths = page.map((b) => this.toBoothRow(b as unknown as IBooth));
    const nextCursor = hasMore ? page[page.length - 1]!._id.toString() : null;

    return { booths, nextCursor };
  }

  async computeSummary(eventId: string): Promise<{
    totalBooths: number;
    totalScans: number;
    uniqueCompanies: number;
    uniquePhones: number;
    boothsWithVoiceNote: number;
    lastBoothAt: string | null;
  }> {
    const eventObjId = new mongoose.Types.ObjectId(eventId);
    const [agg] = await Booth.aggregate([
      { $match: { eventId: eventObjId } },
      {
        $group: {
          _id: null,
          totalBooths: { $sum: 1 },
          totalScans: { $sum: '$scanCount' },
          allCompanies: { $push: '$companies' },
          allPhones: { $push: '$phones' },
          boothsWithVoiceNote: { $sum: { $cond: ['$hasVoiceNote', 1, 0] } },
          lastBoothAt: { $max: '$createdAt' },
        },
      },
      {
        $project: {
          _id: 0,
          totalBooths: 1,
          totalScans: 1,
          uniqueCompanies: {
            $size: {
              $setUnion: [
                {
                  $filter: {
                    input: { $reduce: { input: '$allCompanies', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
                    as: 'c',
                    cond: { $and: [{ $ne: ['$$c', null] }, { $ne: ['$$c', ''] }] },
                  },
                },
                [],
              ],
            },
          },
          uniquePhones: {
            $size: {
              $setUnion: [
                {
                  $filter: {
                    input: { $reduce: { input: '$allPhones', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
                    as: 'p',
                    cond: { $and: [{ $ne: ['$$p', null] }, { $ne: ['$$p', ''] }] },
                  },
                },
                [],
              ],
            },
          },
          boothsWithVoiceNote: 1,
          lastBoothAt: 1,
        },
      },
    ]);

    if (!agg) {
      return {
        totalBooths: 0,
        totalScans: 0,
        uniqueCompanies: 0,
        uniquePhones: 0,
        boothsWithVoiceNote: 0,
        lastBoothAt: null,
      };
    }

    return {
      totalBooths: agg.totalBooths ?? 0,
      totalScans: agg.totalScans ?? 0,
      uniqueCompanies: agg.uniqueCompanies ?? 0,
      uniquePhones: agg.uniquePhones ?? 0,
      boothsWithVoiceNote: agg.boothsWithVoiceNote ?? 0,
      lastBoothAt: agg.lastBoothAt ? new Date(agg.lastBoothAt).toISOString() : null,
    };
  }

  toBoothRow(booth: IBooth): BoothRow {
    return {
      id: booth._id.toString(),
      timestamp: booth.createdAt.toISOString(),
      boothName: booth.boothName || null,
      scanCount: booth.scanCount,
      names: booth.names ?? [],
      phones: booth.phones ?? [],
      emails: booth.emails ?? [],
      companies: booth.companies ?? [],
      websites: booth.websites ?? [],
      linkedinUrls: booth.linkedinUrls ?? [],
      socialMediaUrls: booth.socialMediaUrls ?? [],
      rawOcr: booth.scans ?? [],
      voiceTranscript: booth.voiceTranscript || null,
      imageUrls: booth.imageUrls ?? [],
    };
  }
}
