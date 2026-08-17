/**
 * OpenRouter AI Provider
 * 
 * Uses OpenRouter's OpenAI-compatible API for market analysis.
 * OpenRouter gives access to 100+ models through a single API,
 * including FREE models (great for starting without credits!).
 * 
 * Website: https://openrouter.ai/
 * API Docs: https://openrouter.ai/docs
 * 
 * FREE models available:
 * - meta-llama/llama-3.1-70b-instruct:free
 * - mistralai/mistral-7b-instruct:free
 * - google/gemma-2-9b-it:free
 */

import OpenAI from 'openai';
import { AIProvider, AIAnalysisRequest, AIAnalysisResponse, parseAIOutput } from './ai-provider';
import config from '@config/index';
import { logger } from '@utils/logger';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterProvider implements AIProvider {
  readonly name = 'OpenRouter';
  readonly providerId = 'openrouter' as const;
  readonly models = [
    'meta-llama/llama-3.1-70b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-2-9b-it:free',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
  ];
  readonly supportsVision = true;

  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = config.ai.openrouter?.apiKey || process.env.OPENROUTER_API_KEY || '';
      
      if (!apiKey) {
        throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY in backend/.env');
      }

      this.client = new OpenAI({
        apiKey,
        baseURL: OPENROUTER_BASE_URL,
        defaultHeaders: {
          'HTTP-Referer': 'https://ai-trading-platform.vercel.app',
          'X-Title': 'AI Trading Platform',
        },
      });
    }
    return this.client;
  }

  isAvailable(): boolean {
    const apiKey = config.ai.openrouter?.apiKey || process.env.OPENROUTER_API_KEY || '';
    return !!apiKey;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter API key not configured');
    }

    const client = this.getClient();
    const model = this.models[0];

    logger.info('OpenRouter analysis request', { model, analysisType: request.analysisType });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: request.systemPrompt },
    ];

    if (request.chartImage && request.analysisType !== 'data') {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: request.prompt },
          { type: 'image_url', image_url: { url: request.chartImage } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: request.prompt });
    }

    const response = await client.chat.completions.create({
      model,
      messages,
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.3,
    });

    const content = response.choices[0]?.message?.content || '';
    const usage = response.usage;
    const structured = parseAIOutput(content);

    return {
      reasoning: content,
      structured,
      model,
      usage: {
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      },
    };
  }
}
