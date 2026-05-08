import { sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { drive_v3 } from 'googleapis';

export class SheetsClient {
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive;
  private auth: OAuth2Client;

  constructor(auth: OAuth2Client) {
    this.auth = auth;
    this.sheets = google.sheets({
      version: 'v4',
      auth: auth as any,
    });
    this.drive = google.drive({
      version: 'v3',
      auth: auth as any,
    });
  }

  async createSheet(title: string, parentFolderId?: string): Promise<{ sheetId: string; sheetUrl: string }> {
    try {
      console.log('[SheetsClient] Creating spreadsheet:', title);
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
      console.log('[SheetsClient] Spreadsheet created:', spreadsheetId);

      if (parentFolderId) {
        console.log('[SheetsClient] Moving spreadsheet to folder:', parentFolderId);
        await this.drive.files.update({
          fileId: spreadsheetId,
          addParents: parentFolderId,
          fields: 'id, parents',
        });
        console.log('[SheetsClient] Spreadsheet moved to folder');
      }

      const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      return {
        sheetId: spreadsheetId,
        sheetUrl,
      };
    } catch (error) {
      console.error('[SheetsClient] Error in createSheet:', error instanceof Error ? error.message : error);
      throw error;
    }
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
