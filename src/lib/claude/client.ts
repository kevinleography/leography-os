import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const MODELS = {
  sonnet: process.env.CLAUDE_SONNET_MODEL || 'claude-sonnet-4-20250514',
  haiku: process.env.CLAUDE_HAIKU_MODEL || 'claude-haiku-4-5-20251001',
} as const;
