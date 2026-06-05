import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@/utils/asyncHandler';
import { authService } from '@/infra/container';

const authQuerySchema = z.object({
  origin: z.string().optional(),
  returnUrl: z.string().optional(),
});

const callbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
});

const decodeState = (
  state: string | undefined
): { origin?: string; returnUrl?: string } => {
  if (!state) return {};
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    return {
      origin: typeof decoded?.origin === 'string' ? decoded.origin : undefined,
      returnUrl: typeof decoded?.returnUrl === 'string' ? decoded.returnUrl : undefined,
    };
  } catch {
    return {};
  }
};

const resolveFrontendUrl = (origin: string | undefined): string =>
  origin || process.env.FRONTEND_URL || 'http://localhost:5173';

export class AuthController {
  googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const query = authQuerySchema.parse(req.query);
    const url = authService.buildGoogleAuthUrl(query);
    res.redirect(url);
  });

  googleAuthCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = callbackQuerySchema.parse(req.query);
    const { origin, returnUrl } = decodeState(state);
    const frontendUrl = resolveFrontendUrl(origin);
    const returnUrlSuffix = returnUrl
      ? `&returnUrl=${encodeURIComponent(returnUrl)}`
      : '';

    if (!code) {
      return res.redirect(`${frontendUrl}/signin?error=No authorization code`);
    }

    try {
      const { token, user } = await authService.signInWithGoogleCode(code);
      return res.redirect(
        `${frontendUrl}/signin?jwt=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}${returnUrlSuffix}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return res.redirect(`${frontendUrl}/signin?error=${encodeURIComponent(errorMsg)}`);
    }
  });
}

export const authController = new AuthController();
