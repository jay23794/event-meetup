import { OAuth2Client } from 'google-auth-library';
import { DriveClient } from '@/libs/drive.client';
import { ApiError } from '@/errors/ApiError';

export class DriveService {
  private driveClient: DriveClient;

  constructor(oauthClient: OAuth2Client) {
    this.driveClient = new DriveClient(oauthClient);
  }

  async ensureMeetSyncFolder(oauth: OAuth2Client, currentMeetSyncFolderId?: string): Promise<string> {
    if (currentMeetSyncFolderId) {
      console.log('[DriveService] MeetSync folder already exists:', currentMeetSyncFolderId);
      return currentMeetSyncFolderId;
    }

    try {
      console.log('[DriveService] Creating MeetSync folder...');
      const folderId = await this.driveClient.ensureFolder(oauth, 'MeetSync', null);
      console.log('[DriveService] MeetSync folder created/found:', folderId);
      return folderId;
    } catch (error) {
      console.error('[DriveService] Error in ensureMeetSyncFolder:', error);
      throw new ApiError(502, 'Failed to create MeetSync folder', {
        code: 'DRIVE_FOLDER_ERROR',
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async ensureEventFolder(
    oauth: OAuth2Client,
    eventName: string,
    eventId: string,
    meetSyncFolderId: string
  ): Promise<string> {
    const eventFolderName = `${eventName}_${eventId}`;

    try {
      console.log('[DriveService] Ensuring event folder:', eventFolderName);
      const folderId = await this.driveClient.ensureFolder(oauth, eventFolderName, meetSyncFolderId);
      console.log('[DriveService] Event folder ensured:', folderId);
      return folderId;
    } catch (error) {
      console.error('[DriveService] Error ensuring event folder:', error instanceof Error ? error.message : error);
      throw new ApiError(502, 'Failed to create event folder', {
        code: 'DRIVE_FOLDER_ERROR',
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async ensureBoothFolder(
    oauth: OAuth2Client,
    eventFolderId: string
  ): Promise<string> {
    try {
      console.log('[DriveService] Ensuring booth folder under:', eventFolderId);
      const folderId = await this.driveClient.ensureFolder(oauth, 'Booth', eventFolderId);
      console.log('[DriveService] Booth folder ensured:', folderId);
      return folderId;
    } catch (error) {
      console.error('[DriveService] Error ensuring booth folder:', error instanceof Error ? error.message : error);
      throw new ApiError(502, 'Failed to create Booth folder', {
        code: 'DRIVE_FOLDER_ERROR',
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
