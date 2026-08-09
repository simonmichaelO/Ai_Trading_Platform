/**
 * Application Configuration
 * 
 * Centralized configuration loader that reads from environment variables.
 * Validates required variables at startup to fail fast on misconfiguration.
 * 
 * SECURITY: This is the ONLY file that reads process.env directly.
 * All other modules import from this config.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Validate that a required environment variable exists.
 * In production: throws immediately — fail fast, don't start a broken server.
 * In development: warns but continues — allows testing without full setup.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    if (isProduction) {
      throw new Error(
        `❌ Missing required environment variable: ${key}\n` +
        `   Check your backend/.env file. See .env.example for guidance.`
      );
    } else {
      console.warn(
        `⚠️  Missing environment variable: ${key} (optional in development)`
      );
      return '';
    }
  }
  return value;
}

/**
 * Get an optional environment variable with a fallback default.
 */
function optionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : defaultValue;
}

// ──────────────────────────────────────────────
// Configuration object — single source of truth
// ──────────────────────────────────────────────
export const config = {
  /** Server & environment settings */
  server: {
    env: optionalEnv('NODE_ENV', 'development'),
    port: parseInt(optionalEnv('PORT', '5000'), 10),
    apiPrefix: optionalEnv('API_PREFIX', '/api/v1'),
    isProduction,
    isDevelopment: !isProduction,
  },

  /** Supabase connection settings */
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: requireEnv('SUPABASE_ANON_KEY'),
  },

  /** CORS settings */
  cors: {
    origin: optionalEnv('CORS_ORIGIN', 'http://localhost:3000'),
  },

  /** AI provider API keys */
  ai: {
    openai: {
      apiKey: optionalEnv('OPENAI_API_KEY', ''),
    },
    anthropic: {
      apiKey: optionalEnv('ANTHROPIC_API_KEY', ''),
    },
    gemini: {
      apiKey: optionalEnv('GEMINI_API_KEY', ''),
    },
  },

  /** Logging settings */
  logging: {
    level: optionalEnv('LOG_LEVEL', 'info'),
  },
};

// Validate that at least one AI provider is configured
const hasAnyAiKey = 
  config.ai.openai.apiKey !== '' ||
  config.ai.anthropic.apiKey !== '' ||
  config.ai.gemini.apiKey !== '';

if (!hasAnyAiKey) {
  console.warn(
    '⚠️  No AI provider keys configured. AI features will not work.\n' +
    '   Add at least one key to backend/.env'
  );
}

export default config;
