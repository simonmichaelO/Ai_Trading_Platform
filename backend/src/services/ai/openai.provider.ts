/**
 * OpenAI AI Provider
 * 
 * Uses OpenAI's GPT-4o for market analysis.
 * 
 * Models available:
 * - gpt-4o        — Best quality, supports vision
 * - gpt-4o-mini   — Faster, cheaper, supports vision
 * 
 * 🔴 CHANGE THIS — Set OPENAI_API_KEY in backend/.env
 * Get your key from: https://platform.openai.com/api-keys
 */

import OpenAI from 'openai';
import { AIProvider, AIAnalysisRequest, AIAnalysisResponse } from './ai-provider';
import { parseAIOutput } from './ai-provider';
import config from '@config/index';
import { logger } from '@utils/logger';

const OPENAI_API_KEY = config.ai.openai.apiKey || process.env.OPENAI_API_KEY || '';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  readonly providerId = 'openai' as const;
  readonly models = ['gpt-4o', 'gpt-4o-mini'];
  readonly supportsVision = true;

  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: OPENAI_API_KEY });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return !!OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here';
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in backend/.env');
    }

    const client = this.getClient();
    const model = 'gpt-4o'; // Use best model for analysis

    logger.info('OpenAI analysis request', { model, analysisType: request.analysisType });

    // Build messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: request.systemPrompt,
      },
    ];

    // Add user message (with or without image)
    if (request.chartImage && request.analysisType !== 'data') {
      // Vision analysis — include image
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: request.prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: request.chartImage,
              detail: 'high',
            },
          },
        ],
      });
    } else {
      // Text-only analysis
      messages.push({
        role: 'user',
        content: request.prompt,
      });
    }

    const response = await client.chat.completions.create({
      model,
      messages,
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.3, // Low temperature for consistent analysis
    });

    const content = response.choices[0]?.message?.content || '';
    const usage = response.usage;

    // Parse structured output from the response
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
