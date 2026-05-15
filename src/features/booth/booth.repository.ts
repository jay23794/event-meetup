import { Booth, IBooth } from './booth.model';
import { BoothRow } from './booth.types';
import { SheetsClient } from '@/shared/google/sheets.client';
import mongoose from 'mongoose';

export class BoothRepository {
  async createBooth(boothData: {
    ownerUserId: string;
    eventId: string;
    boothName?: string;
    description?: string;
    qrId: string;
    qrUrl: string;
    scanCount: number;
    hasVoiceNote: boolean;
    sheetRowNumber: number;
    websites?: string[];
    linkedinUrls?: string[];
    socialMediaUrls?: string[];
  }): Promise<IBooth> {
    const booth = new Booth({
      ownerUserId: new mongoose.Types.ObjectId(boothData.ownerUserId),
      eventId: new mongoose.Types.ObjectId(boothData.eventId),
      boothName: boothData.boothName,
      description: boothData.description,
      qrId: boothData.qrId,
      qrUrl: boothData.qrUrl,
      scanCount: boothData.scanCount,
      hasVoiceNote: boothData.hasVoiceNote,
      sheetRowNumber: boothData.sheetRowNumber,
      websites: boothData.websites || [],
      linkedinUrls: boothData.linkedinUrls || [],
      socialMediaUrls: boothData.socialMediaUrls || [],
    });
    return booth.save();
  }

  async findBoothsByEvent(eventId: string): Promise<IBooth[]> {
    return Booth.find({ eventId: new mongoose.Types.ObjectId(eventId) });
  }

  async findBoothById(boothId: string): Promise<IBooth | null> {
    return Booth.findById(new mongoose.Types.ObjectId(boothId));
  }

  async readBoothRows(
    sheetsClient: SheetsClient,
    sheetId: string,
    tabName: string,
    startRow: number,
    limit: number
  ): Promise<BoothRow[]> {
    const endRow = startRow + limit;
    const range = `'${tabName}'!A${startRow}:M${endRow}`;
    const rows = await sheetsClient.readRange(sheetId, range);

    return rows.map((row, index) => {
      const rowNumber = startRow + index;
      const [
        timestamp = '',
        boothName = '',
        scanCountStr = '',
        namesStr = '',
        phonesStr = '',
        emailsStr = '',
        companiesStr = '',
        websitesStr = '',
        linkedinStr = '',
        socialMediaStr = '',
        rawOcrStr = '',
        voiceTranscript = '',
        imageUrlsStr = '',
      ] = row as string[];

      let rawOcr: Array<{ ocrText: string; extractedFields: Record<string, any> }> = [];
      try {
        rawOcr = JSON.parse(rawOcrStr || '[]');
      } catch {
        rawOcr = [];
      }

      return {
        rowNumber,
        timestamp,
        boothName: boothName || null,
        scanCount: parseInt(scanCountStr || '0', 10),
        names: namesStr ? namesStr.split('; ').filter(Boolean) : [],
        phones: phonesStr ? phonesStr.split('; ').filter(Boolean) : [],
        emails: emailsStr ? emailsStr.split('; ').filter(Boolean) : [],
        companies: companiesStr ? companiesStr.split('; ').filter(Boolean) : [],
        websites: websitesStr ? websitesStr.split('; ').filter(Boolean) : [],
        linkedinUrls: linkedinStr ? linkedinStr.split('; ').filter(Boolean) : [],
        socialMediaUrls: socialMediaStr ? socialMediaStr.split('; ').filter(Boolean) : [],
        rawOcr,
        voiceTranscript: voiceTranscript || null,
        imageUrls: imageUrlsStr ? imageUrlsStr.split('; ').filter(Boolean) : [],
      };
    });
  }

  async readBoothRow(
    sheetsClient: SheetsClient,
    sheetId: string,
    tabName: string,
    rowNumber: number
  ): Promise<BoothRow | null> {
    const range = `'${tabName}'!A${rowNumber}:M${rowNumber}`;
    const rows = await sheetsClient.readRange(sheetId, range);

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0] as string[];
    const [
      timestamp = '',
      boothName = '',
      scanCountStr = '',
      namesStr = '',
      phonesStr = '',
      emailsStr = '',
      companiesStr = '',
      websitesStr = '',
      linkedinStr = '',
      socialMediaStr = '',
      rawOcrStr = '',
      voiceTranscript = '',
      imageUrlsStr = '',
    ] = row;

    let rawOcr: Array<{ ocrText: string; extractedFields: Record<string, any> }> = [];
    try {
      rawOcr = JSON.parse(rawOcrStr || '[]');
    } catch {
      rawOcr = [];
    }

    return {
      rowNumber,
      timestamp,
      boothName: boothName || null,
      scanCount: parseInt(scanCountStr || '0', 10),
      names: namesStr ? namesStr.split('; ').filter(Boolean) : [],
      phones: phonesStr ? phonesStr.split('; ').filter(Boolean) : [],
      emails: emailsStr ? emailsStr.split('; ').filter(Boolean) : [],
      companies: companiesStr ? companiesStr.split('; ').filter(Boolean) : [],
      websites: websitesStr ? websitesStr.split('; ').filter(Boolean) : [],
      linkedinUrls: linkedinStr ? linkedinStr.split('; ').filter(Boolean) : [],
      socialMediaUrls: socialMediaStr ? socialMediaStr.split('; ').filter(Boolean) : [],
      rawOcr,
      voiceTranscript: voiceTranscript || null,
      imageUrls: imageUrlsStr ? imageUrlsStr.split('; ').filter(Boolean) : [],
    };
  }

  async computeSummary(
    sheetsClient: SheetsClient,
    sheetId: string,
    tabName: string
  ): Promise<{
    totalBooths: number;
    totalScans: number;
    uniqueCompanies: number;
    uniquePhones: number;
    boothsWithVoiceNote: number;
    lastBoothAt: string | null;
  }> {
    const booths = await this.readBoothRows(sheetsClient, sheetId, tabName, 2, 10000);

    const uniqueCompaniesSet = new Set<string>();
    const uniquePhonesSet = new Set<string>();
    let totalScans = 0;
    let boothsWithVoiceNote = 0;
    let lastBoothAt: string | null = null;

    booths.forEach((booth) => {
      totalScans += booth.scanCount;
      booth.companies.forEach((company) => uniqueCompaniesSet.add(company));
      booth.phones.forEach((phone) => uniquePhonesSet.add(phone));
      if (booth.voiceTranscript) {
        boothsWithVoiceNote += 1;
      }
      if (!lastBoothAt || booth.timestamp > lastBoothAt) {
        lastBoothAt = booth.timestamp;
      }
    });

    return {
      totalBooths: booths.length,
      totalScans,
      uniqueCompanies: uniqueCompaniesSet.size,
      uniquePhones: uniquePhonesSet.size,
      boothsWithVoiceNote,
      lastBoothAt,
    };
  }
}
