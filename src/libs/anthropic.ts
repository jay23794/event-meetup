import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/config/env';

export const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY,
});
