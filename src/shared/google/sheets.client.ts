import { sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export class SheetsClient {
  private sheets: sheets_v4.Sheets;

  constructor(auth: OAuth2Client) {
    this.sheets = google.sheets({
      version: 'v4',
      auth: auth as any,
    });
  }

  async createSheet(title: string, parentFolderId?: string): Promise<{ sheetId: string; sheetUrl: string }> {
    const response = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
      },
    });

    const spreadsheetId = response.data.spreadsheetId;
    if (!spreadsheetId) {
      throw new Error('Failed to create spreadsheet');
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return {
      sheetId: spreadsheetId,
      sheetUrl,
    };
  }

  async addHeaderRow(
    sheetId: string,
    headers: string[]
  ): Promise<void> {
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });
  }

  async appendRow(sheetId: string, values: unknown[]): Promise<{ updatedRows: number; updatedRange: string }> {
    const response = await this.sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:J',
      valueInputOption: 'RAW',
      requestBody: {
        values: [values],
      },
    });

    return {
      updatedRows: response.data.updates?.updatedRows || 0,
      updatedRange: response.data.updates?.updatedRange || '',
    };
  }

  async readRange(sheetId: string, range: string): Promise<unknown[][]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return response.data.values || [];
  }
}
