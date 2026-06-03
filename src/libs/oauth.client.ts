import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config/env';

export function createOAuthClient(refreshToken: string): OAuth2Client {
  const client = new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );

  client.setCredentials({
    refresh_token: refreshToken,
  });

  return client;
}
