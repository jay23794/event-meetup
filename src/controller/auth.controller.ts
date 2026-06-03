import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config/env';
import { AuthService, authService } from '@/service/auth.service';
import { asyncHandler } from '@/utils/asyncHandler';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const oauth2Client = new OAuth2Client(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );

    const origin = (req.query.origin as string) || '';
    const returnUrl = (req.query.returnUrl as string) || '';
    const state =
      origin || returnUrl
        ? Buffer.from(JSON.stringify({ origin, returnUrl })).toString(
            'base64url'
          )
        : undefined;

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.file',
      ],
      prompt: 'consent',
      ...(state ? { state } : {}),
    });

    res.redirect(authUrl);
  });

  private decodeState(
    req: Request
  ): { origin?: string; returnUrl?: string } {
    const stateParam = req.query.state as string | undefined;
    if (!stateParam) return {};
    try {
      const decoded = JSON.parse(
        Buffer.from(stateParam, 'base64url').toString('utf8')
      );
      return {
        origin:
          typeof decoded?.origin === 'string' ? decoded.origin : undefined,
        returnUrl:
          typeof decoded?.returnUrl === 'string'
            ? decoded.returnUrl
            : undefined,
      };
    } catch {
      return {};
    }
  }

  private resolveFrontendUrl(req: Request): string {
    const { origin } = this.decodeState(req);
    if (origin) return origin;
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  googleAuthCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;
    const frontendUrl = this.resolveFrontendUrl(req);
    const { returnUrl } = this.decodeState(req);
    const returnUrlSuffix = returnUrl
      ? `&returnUrl=${encodeURIComponent(returnUrl)}`
      : '';

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
        `${frontendUrl}/signin?jwt=${encodeURIComponent(result.token)}&email=${encodeURIComponent(result.user.email)}&name=${encodeURIComponent(result.user.name)}${returnUrlSuffix}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.redirect(`${frontendUrl}/signin?error=${encodeURIComponent(errorMsg)}`);
    }
  });
}

export const authController = new AuthController();
