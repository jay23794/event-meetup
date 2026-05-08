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
    console.log('[DriveClient] Searching for folder:', { name, parentId, query });

    const response = await driveApi.files.list({
      q: query,
      fields: 'files(id)',
      pageSize: 1,
    });

    const existingFolder = response.data.files?.[0]?.id;
    if (existingFolder) {
      console.log('[DriveClient] Folder already exists:', { name, id: existingFolder });
      return existingFolder;
    }

    console.log('[DriveClient] Creating new folder:', name);
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

    console.log('[DriveClient] Folder created:', { name, id: createResponse.data.id });
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

  async ensureRootFolder(oauth: OAuth2Client): Promise<string> {
    const driveApi = google.drive({ version: 'v3', auth: oauth as any });

    const query = "name='MeetSync' and 'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false";
    console.log('[DriveClient] Searching for root MeetSync folder');

    const response = await driveApi.files.list({
      q: query,
      fields: 'files(id)',
      pageSize: 1,
    });

    const existingFolder = response.data.files?.[0]?.id;
    if (existingFolder) {
      console.log('[DriveClient] MeetSync root folder found:', existingFolder);
      return existingFolder;
    }

    console.log('[DriveClient] Creating MeetSync root folder');
    const createResponse = await driveApi.files.create({
      requestBody: {
        name: 'MeetSync',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    if (!createResponse.data.id) {
      throw new Error('Failed to create MeetSync root folder');
    }

    console.log('[DriveClient] MeetSync root folder created:', createResponse.data.id);
    return createResponse.data.id;
  }

  async ensureMyBoothsFolder(oauth: OAuth2Client, rootFolderId: string): Promise<string> {
    return this.findOrCreateFolder(oauth, 'My Booths', rootFolderId);
  }

  async ensureEventSubfolder(oauth: OAuth2Client, parentFolderId: string, eventName: string): Promise<string> {
    const sanitizedName = eventName.replace(/['/]/g, '');
    return this.findOrCreateFolder(oauth, sanitizedName, parentFolderId);
  }

  async setPublicPermission(oauth: OAuth2Client, fileId: string): Promise<void> {
    const driveApi = google.drive({ version: 'v3', auth: oauth as any });

    console.log('[DriveClient] Setting public permission for file:', fileId);
    await driveApi.permissions.create({
      fileId,
      requestBody: {
        type: 'anyone',
        role: 'reader',
      },
    });
    console.log('[DriveClient] Public permission set');
  }

  private async findOrCreateFolder(oauth: OAuth2Client, name: string, parentId: string): Promise<string> {
    const driveApi = google.drive({ version: 'v3', auth: oauth as any });

    const escapedName = name.replace(/'/g, "\\'");
    const query = `name='${escapedName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    console.log('[DriveClient] Searching for folder:', { name, parentId });

    const response = await driveApi.files.list({
      q: query,
      fields: 'files(id)',
      pageSize: 1,
    });

    const existingFolder = response.data.files?.[0]?.id;
    if (existingFolder) {
      console.log('[DriveClient] Folder found:', { name, id: existingFolder });
      return existingFolder;
    }

    console.log('[DriveClient] Creating folder:', name);
    const createResponse = await driveApi.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });

    if (!createResponse.data.id) {
      throw new Error(`Failed to create folder: ${name}`);
    }

    console.log('[DriveClient] Folder created:', { name, id: createResponse.data.id });
    return createResponse.data.id;
  }
}
