import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { config } from '@/config/env';

export const googleAuth = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
);

export const googleDrive = google.drive({
  version: 'v3',
  auth: googleAuth as any,
});
