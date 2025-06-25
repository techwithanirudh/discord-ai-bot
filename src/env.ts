import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    // Discord
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_OWNER_ID: z.string().min(1),
    DISCORD_DEFAULT_GUILD_ID: z.string().optional(),
    // AI
    OPENAI_API_KEY: z.string().optional(),
    HACKCLUB_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    // Logging
    LOG_DIRECTORY: z.string().optional().default('logs'),
    LOG_LEVEL: z
      .enum(['debug', 'info', 'warn', 'error'])
      .optional()
      .default('info'),
    // Redis
    UPSTASH_REDIS_REST_URL: z.url().min(1),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    // AssemblyAI
    DEEPGRAM_API_KEY: z.string().min(1),
    // ElevenLabs
    // ELEVENLABS_API_KEY: z.string().min(1),
    // Exa
    EXA_API_KEY: z.string().min(1),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});
