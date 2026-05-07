import Anthropic from '@anthropic-ai/sdk';
import { config } from './env';

export const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY,
});
