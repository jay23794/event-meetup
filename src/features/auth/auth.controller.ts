import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config/env';
import { AuthService } from './auth.service';
import { ApiResponse } from '@/shared/utils/ApiResponse';
import { asyncHandler } from '@/shared/utils/asyncHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || '';
    await this.service.logout(userId);
    res.status(200).json(ApiResponse.success(null, 'Logout successful'));
  });

  googleAuth = asyncHandler(async (_req: Request, res: Response) => {
    const oauth2Client = new OAuth2Client(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
      prompt: 'consent',
    });

    res.redirect(authUrl);
  });

  googleAuthCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/signin?error=No authorization code`);
    }

    try {
      const oauth2Client = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code as string);
      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/signin?error=No refresh token received`);
      }

      oauth2Client.setCredentials(tokens);

      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token as string,
        audience: config.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/signin?error=Could not get user info from Google`);
      }

      const googleUserInfo = {
        email: payload.email,
        name: payload.name || payload.email,
        picture: payload.picture,
      };

      const result = await this.service.googleSignIn(googleUserInfo, refreshToken);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(
        `${frontendUrl}/signin?jwt=${encodeURIComponent(result.token)}&email=${encodeURIComponent(result.user.email)}&name=${encodeURIComponent(result.user.name)}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/signin?error=${encodeURIComponent(errorMsg)}`);
    }
  });
}
