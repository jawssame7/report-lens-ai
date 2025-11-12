import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Load .env.local first (higher priority), then .env
const envLocalPath = join(process.cwd(), '.env.local');
const envPath = join(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath });
} else if (existsSync(envPath)) {
  loadEnv({ path: envPath });
}

const parseOrigins = (value: string | undefined): string[] => {
  if (!value) return ['http://localhost:5173'];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const serverConfig = {
  port: Number(process.env.PORT ?? 4000),
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  upload: {
    maxFileCount: Number(process.env.MAX_FILE_COUNT ?? 10),
    maxTotalBytes: Number(process.env.MAX_TOTAL_BYTES ?? 100 * 1024 * 1024)
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
  }
};

export const isGeminiConfigured = (): boolean => Boolean(serverConfig.gemini.apiKey);
