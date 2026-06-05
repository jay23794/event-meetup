import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config/env';
import { AuthRepository } from '@/repository/auth.repository';
import { ApiError } from '@/errors/ApiError';
import { generateToken } from '@/utils/jwt';
import { createOAuthClient } from '@/libs/oauth.client';
import { DriveService } from '@/service/drive.service';

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
];

const buildOAuthClient = () =>
  new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );

export class AuthService {
  constructor(private _repository: AuthRepository) {}

  buildGoogleAuthUrl(params: { origin?: string; returnUrl?: string }): string {
    const { origin, returnUrl } = params;
    const oauth2Client = buildOAuthClient();
    const state =
      origin || returnUrl
        ? Buffer.from(JSON.stringify({ origin, returnUrl })).toString('base64url')
        : undefined;

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_SCOPES,
      prompt: 'consent',
      ...(state ? { state } : {}),
    });
  }

  async signInWithGoogleCode(code: string) {
    const oauth2Client = buildOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new ApiError(400, 'No refresh token received');
    }
    if (!tokens.id_token) {
      throw new ApiError(400, 'No ID token received');
    }

    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new ApiError(400, 'Could not get user info from Google');
    }

    return this.googleSignIn(
      {
        email: payload.email,
        name: payload.name || payload.email,
        picture: payload.picture,
      },
      tokens.refresh_token
    );
  }

  async googleSignIn(googleUserInfo: GoogleUserInfo, refreshToken: string) {
    let user = await this._repository.findUserByEmail(googleUserInfo.email);

    if (!user) {
      user = await this._repository.createUser({
        email: googleUserInfo.email,
        name: googleUserInfo.name,
        password: Math.random().toString(36).slice(2),
      });
    }

    await this._repository.updateUser(user._id.toString(), {
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
        await this._repository.updateUser(user._id.toString(), {
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


