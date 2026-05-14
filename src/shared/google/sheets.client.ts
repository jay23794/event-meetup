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
    headers: string[],
    sheetName: string = 'Sheet1'
  ): Promise<void> {
    console.log('[SheetsClient] Adding header row:', { spreadsheetId: sheetId, sheetName, columnCount: headers.length });
    const range = `${sheetName}!A1`;
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
      console.log('[SheetsClient] Header row added:', { range, updatedCells: response.data.updates?.updatedCells });
    } catch (error) {
      console.error('[SheetsClient] addHeaderRow failed:', { range, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async appendRow(sheetId: string, values: unknown[], sheetName: string = 'Sheet1'): Promise<{ updatedRows: number; updatedRange: string }> {
    const range = `${sheetName}!A:Z`;
    console.log('[SheetsClient] Appending row:', { spreadsheetId: sheetId, range, valueCount: values.length });
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });

      const updatedRows = response.data.updates?.updatedRows || 0;
      const updatedRange = response.data.updates?.updatedRange || '';
      console.log('[SheetsClient] Row appended:', { range, updatedRows, updatedRange });

      return {
        updatedRows,
        updatedRange,
      };
    } catch (error) {
      console.error('[SheetsClient] appendRow failed:', { range, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async deleteSheet(spreadsheetId: string, sheetIdToDelete: number): Promise<void> {
    console.log('[SheetsClient] Deleting sheet:', { spreadsheetId, sheetIdToDelete });
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteSheet: {
                sheetId: sheetIdToDelete,
              },
            },
          ],
        },
      });
      console.log('[SheetsClient] Sheet deleted successfully:', { sheetIdToDelete });
    } catch (error) {
      console.error('[SheetsClient] deleteSheet failed:', { sheetIdToDelete, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async addSheet(sheetId: string, sheetTitle: string): Promise<string> {
    console.log('[SheetsClient] Adding sheet:', { spreadsheetId: sheetId, title: sheetTitle });
    const response = await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle,
              },
            },
          },
        ],
      },
    });

    const newSheet = response.data.replies?.[0]?.addSheet?.properties;
    if (!newSheet) {
      console.error('[SheetsClient] addSheet failed - no response');
      throw new Error('Failed to add sheet');
    }
    const addedName = newSheet.title || sheetTitle;
    console.log('[SheetsClient] Sheet added successfully:', { name: addedName, sheetId: newSheet.sheetId });
    return addedName;
  }

  async readRange(sheetId: string, range: string): Promise<unknown[][]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return response.data.values || [];
  }
}
