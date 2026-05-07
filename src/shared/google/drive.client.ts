import { drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Readable } from 'stream';

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

  async ensureFolder(oauth: OAuth2Client, name: string, parentId: string | null): Promise<string> {
    const driveApi = google.drive({ version: 'v3', auth: oauth as any });

    const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false ${parentId ? `and '${parentId}' in parents` : ''}`;
    const response = await driveApi.files.list({
      q: query,
      fields: 'files(id)',
      pageSize: 1,
    });

    const existingFolder = response.data.files?.[0]?.id;
    if (existingFolder) {
      return existingFolder;
    }

    const createResponse = await driveApi.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
      fields: 'id',
    });

    if (!createResponse.data.id) {
      throw new Error(`Failed to create folder: ${name}`);
    }

    return createResponse.data.id;
  }

  async uploadImage(
    oauth: OAuth2Client,
    folderId: string,
    buffer: Buffer,
    filename: string
  ): Promise<{ fileId: string; webContentLink: string }> {
    const driveApi = google.drive({ version: 'v3', auth: oauth as any });
    const stream = Readable.from(buffer);

    const response = await driveApi.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: 'image/jpeg',
        body: stream,
      },
      fields: 'id, webContentLink, webViewLink',
    });

    if (!response.data.id) {
      throw new Error('Failed to upload image to Drive');
    }

    return {
      fileId: response.data.id,
      webContentLink: response.data.webContentLink || response.data.webViewLink || '',
    };
  }

  async makeShareable(oauth: OAuth2Client, fileId: string): Promise<string> {
    const driveApi = google.drive({ version: 'v3', auth: oauth as any });

    await driveApi.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const response = await driveApi.files.get({
      fileId,
      fields: 'webContentLink, webViewLink',
    });

    return response.data.webContentLink || response.data.webViewLink || '';
  }
}
