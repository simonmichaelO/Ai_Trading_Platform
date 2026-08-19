import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    if (isProduction) {
      throw new Error(`Missing required environment variable: ${key}`);
    } else {
      console.warn(`Missing environment variable: ${key} (optional in development)`);
      return '';
    }
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : defaultValue;
}

export const config = {
  server: {
    env: optionalEnv('NODE_ENV', 'development'),
    port: parseInt(optionalEnv('PORT', '5000'), 10),
    apiPrefix: optionalEnv('API_PREFIX', '/api/v1'),
    isProduction,
    isDevelopment: !isProduction,
  },
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: requireEnv('SUPABASE_ANON_KEY'),
  },
  cors: { origin: optionalEnv('CORS_ORIGIN', 'http://localhost:3000') },
  ai: {
    openai: { apiKey: optionalEnv('OPENAI_API_KEY', '') },
    anthropic: { apiKey: optionalEnv('ANTHROPIC_API_KEY', '') },
    gemini: { apiKey: optionalEnv('GEMINI_API_KEY', '') },
    together: { apiKey: optionalEnv('TOGETHER_API_KEY', '') },
    openrouter: { apiKey: optionalEnv('OPENROUTER_API_KEY', '') },
  },
  logging: { level: optionalEnv('LOG_LEVEL', 'info') },
};

const hasAnyAiKey = 
  config.ai.openai.apiKey !== '' || config.ai.anthropic.apiKey !== '' || 
  config.ai.gemini.apiKey !== '' || config.ai.together.apiKey !== '' || config.ai.openrouter.apiKey !== '';

if (!hasAnyAiKey) {
  console.warn('No AI provider keys configured. AI features will not work.');
}

export default config;
