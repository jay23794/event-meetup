import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { config } from './env';

export const googleAuth = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
);

export const googleSheets = google.sheets({
  version: 'v4',
  auth: googleAuth as any,
});

export const googleDrive = google.drive({
  version: 'v3',
  auth: googleAuth as any,
});
