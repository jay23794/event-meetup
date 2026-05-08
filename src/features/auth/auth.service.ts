import { AuthRepository } from './auth.repository';
import { ApiError } from '@/shared/utils/ApiError';
import { generateToken } from '@/shared/utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';
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

  async register(data: RegisterInput) {
    const existingUser = await this.repository.findUserByEmail(data.email);
    if (existingUser) {
      throw ApiError.conflict('User already exists');
    }

    const user = await this.repository.createUser({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { user: { id: user._id, email: user.email, name: user.name }, token };
  }

  async login(email: string, password: string) {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { user: { id: user._id, email: user.email, name: user.name }, token };
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
      console.log('[Auth] Creating/ensuring MeetSync folder for user:', user.email);
      const meetSyncFolderId = await driveService.ensureMeetSyncFolder(oauthClient, user.meetSyncRootFolderId);
      console.log('[Auth] MeetSync folder ID:', meetSyncFolderId);

      if (meetSyncFolderId !== user.meetSyncRootFolderId) {
        console.log('[Auth] Updating user with new MeetSync folder ID');
        await this.repository.updateUser(user._id.toString(), {
          meetSyncRootFolderId: meetSyncFolderId,
        });
      }
    } catch (error) {
      console.error('[Auth] Error creating MeetSync folder:', error);
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

  async logout(_userId: string) {
    return { message: 'Logged out successfully' };
  }
}
