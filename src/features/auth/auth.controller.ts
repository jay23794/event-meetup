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

  googleAccessToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || '';
    const result = await this.service.getGoogleAccessToken(userId);
    res.status(200).json(ApiResponse.success(result));
  });

  googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const oauth2Client = new OAuth2Client(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );

    const origin = (req.query.origin as string) || '';
    const state = origin
      ? Buffer.from(JSON.stringify({ origin })).toString('base64url')
      : undefined;

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
      prompt: 'consent',
      ...(state ? { state } : {}),
    });

    res.redirect(authUrl);
  });

  private resolveFrontendUrl(req: Request): string {
    const stateParam = req.query.state as string | undefined;
    if (stateParam) {
      try {
        const decoded = JSON.parse(
          Buffer.from(stateParam, 'base64url').toString('utf8')
        );
        if (decoded?.origin && typeof decoded.origin === 'string') {
          return decoded.origin;
        }
      } catch {
        // fall through to defaults
      }
    }
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  googleAuthCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;
    const frontendUrl = this.resolveFrontendUrl(req);

    if (!code) {
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
        return res.redirect(`${frontendUrl}/signin?error=No refresh token received`);
      }

      oauth2Client.setCredentials(tokens);

      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token as string,
        audience: config.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return res.redirect(`${frontendUrl}/signin?error=Could not get user info from Google`);
      }

      const googleUserInfo = {
        email: payload.email,
        name: payload.name || payload.email,
        picture: payload.picture,
      };

      const result = await this.service.googleSignIn(googleUserInfo, refreshToken);

      return res.redirect(
        `${frontendUrl}/signin?jwt=${encodeURIComponent(result.token)}&email=${encodeURIComponent(result.user.email)}&name=${encodeURIComponent(result.user.name)}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.redirect(`${frontendUrl}/signin?error=${encodeURIComponent(errorMsg)}`);
    }
  });
}
