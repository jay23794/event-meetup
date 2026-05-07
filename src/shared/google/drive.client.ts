import { drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export class DriveClient {
  private drive: drive_v3.Drive;

  constructor(auth: OAuth2Client) {
    this.drive = google.drive({
      version: 'v3',
      auth: auth as any,
    });
  }

  async createFileInUserDrive(
    name: string,
    mimeType: string,
    parentFolderId?: string
  ): Promise<{ fileId: string; webViewLink: string }> {
    const fileMetadata: drive_v3.Schema$File = {
      name,
      mimeType,
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink',
    });

    if (!response.data.id) {
      throw new Error('Failed to create file in Drive');
    }

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink || '',
    };
  }

  async getFileMetadata(fileId: string): Promise<{ id: string; name: string; webViewLink: string }> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, webViewLink',
    });

    if (!response.data.id) {
      throw new Error('File not found');
    }

    return {
      id: response.data.id,
      name: response.data.name || '',
      webViewLink: response.data.webViewLink || '',
    };
  }
}
