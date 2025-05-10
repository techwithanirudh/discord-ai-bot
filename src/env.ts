import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Discord
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_CLIENT_ID: z.string().min(1),
    // AI
    OPENAI_API_KEY: z.string().optional(),
    HACKCLUB_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    // Logging
    LOG_DIRECTORY: z.string().optional().default("logs"),
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error"])
      .optional()
      .default("info"),
    // Redis
    UPSTASH_REDIS_REST_URL: z.string().min(1).url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    // Mem0
    MEM0_API_KEY: z.string().min(1).startsWith("m0-"),
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
