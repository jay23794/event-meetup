import { AuthRepository } from './auth.repository';
import { ApiError } from '@/shared/utils/ApiError';
import { generateToken } from '@/shared/utils/jwt';
import { createOAuthClient } from '@/shared/google/oauth.client';
import { DriveService } from '@/features/drive/drive.service';

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async googleSignIn(googleUserInfo: GoogleUserInfo, refreshToken: string) {
    let user = await this.repository.findUserByEmail(googleUserInfo.email);

    if (!user) {
      user = await this.repository.createUser({
        email: googleUserInfo.email,
        name: googleUserInfo.name,
        password: Math.random().toString(36).slice(2),
      });
    }

    await this.repository.updateUser(user._id.toString(), {
      googleRefreshToken: refreshToken,
    });

    try {
      const oauthClient = createOAuthClient(refreshToken);
      const driveService = new DriveService(oauthClient);
      const meetSyncFolderId = await driveService.ensureMeetSyncFolder(
        oauthClient,
        user.meetSyncRootFolderId
      );

      if (meetSyncFolderId !== user.meetSyncRootFolderId) {
        await this.repository.updateUser(user._id.toString(), {
          meetSyncRootFolderId: meetSyncFolderId,
        });
      }
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 502) {
        throw error;
      }
      throw new ApiError(502, 'Failed to create MeetSync folder', { code: 'DRIVE_FOLDER_ERROR' });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: { id: user._id, email: user.email, name: user.name },
      token,
    };
  }
}
