import { AIProvider as AIProviderInterface, AIAnalysisRequest, AIAnalysisResponse } from './ai-provider';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';
import { TogetherAIProvider } from './together.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import { logger } from '@utils/logger';
import type { MarketSnapshot, AIProvider, AnalysisType } from '@models/index';

const providers: AIProviderInterface[] = [
  new OpenAIProvider(),
  new AnthropicProvider(),
  new GeminiProvider(),
  new TogetherAIProvider(),
  new OpenRouterProvider(),
];

function getProvider(requestedProvider: AIProvider): AIProviderInterface {
  const requested = providers.find(p => p.providerId === requestedProvider);
  if (requested && requested.isAvailable()) {
    return requested;
  }

  const available = providers.find(p => p.isAvailable());
  if (available) {
    logger.warn(`Provider ${requestedProvider} unavailable, falling back to ${available.name}`, {
      requestedProvider,
      fallbackProvider: available.providerId,
    });
    return available;
  }

  throw new Error(
    'No AI provider is configured. Add at least one API key to backend/.env:\n' +
    '  OPENAI_API_KEY — https://platform.openai.com/api-keys\n' +
    '  ANTHROPIC_API_KEY — https://console.anthropic.com/\n' +
    '  GEMINI_API_KEY — https://makersuite.google.com/app/apikey\n' +
    '  TOGETHER_API_KEY — https://api.together.ai/\n' +
    '  OPENROUTER_API_KEY — https://openrouter.ai/keys'
  );
}

export interface AnalysisRequest {
  symbol: string;
  timeframe: string;
  marketSnapshot: MarketSnapshot;
  provider: AIProvider;
  analysisType: AnalysisType;
  chartImage?: string;
  strategy?: {
    name: string;
    description?: string;
    entry_rules?: string[];
    exit_rules?: string[];
    risk_rules?: string[];
    indicators?: string[];
    prompt_template?: string;
  };
}

export async function performAnalysis(request: AnalysisRequest): Promise<{
  response: AIAnalysisResponse;
  providerUsed: string;
  providerId: AIProvider;
}> {
  const provider = getProvider(request.provider);

  logger.info('Starting AI analysis', {
    symbol: request.symbol,
    timeframe: request.timeframe,
    provider: provider.name,
    analysisType: request.analysisType,
  });

  const includeVision = request.analysisType !== 'data' && !!request.chartImage;
  const systemPrompt = buildSystemPrompt(request.provider, request.strategy, includeVision);
  const userPrompt = buildUserPrompt(request.symbol, request.timeframe, request.marketSnapshot, request.analysisType);

  const aiRequest: AIAnalysisRequest = {
    prompt: userPrompt,
    systemPrompt,
    analysisType: request.analysisType,
    chartImage: request.chartImage,
    maxTokens: 2000,
    temperature: 0.3,
  };

  const response = await provider.analyze(aiRequest);

  logger.info('AI analysis complete', {
    symbol: request.symbol,
    provider: provider.name,
    model: response.model,
    tokens: response.usage.totalTokens,
    direction: response.structured.direction,
    confidence: response.structured.confidence,
  });

  return { response, providerUsed: provider.name, providerId: provider.providerId };
}

export function getAvailableProviders(): Array<{
  id: AIProvider;
  name: string;
  available: boolean;
  models: string[];
  supportsVision: boolean;
}> {
  return providers.map(p => ({
    id: p.providerId,
    name: p.name,
    available: p.isAvailable(),
    models: p.models,
    supportsVision: p.supportsVision,
  }));
}

export function hasAnyProvider(): boolean {
  return providers.some(p => p.isAvailable());
}
