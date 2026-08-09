/**
 * Anthropic AI Provider (Claude)
 * 
 * Uses Anthropic's Claude models for market analysis.
 * Claude is excellent at structured reasoning and chart analysis.
 * 
 * Models available:
 * - claude-sonnet-4-20250514  — Best balance of speed and quality, supports vision
 * - claude-3-5-haiku-20241022 — Fastest, cheapest, supports vision
 * 
 * 🔴 CHANGE THIS — Set ANTHROPIC_API_KEY in backend/.env
 * Get your key from: https://console.anthropic.com/
 */

import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIAnalysisRequest, AIAnalysisResponse } from './ai-provider';
import { parseAIOutput } from './ai-provider';
import config from '@config/index';
import { logger } from '@utils/logger';

const ANTHROPIC_API_KEY = config.ai.anthropic.apiKey || process.env.ANTHROPIC_API_KEY || '';

export class AnthropicProvider implements AIProvider {
  readonly name = 'Anthropic';
  readonly providerId = 'anthropic' as const;
  readonly models = ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'];
  readonly supportsVision = true;

  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return !!ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here';
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic API key not configured. Set ANTHROPIC_API_KEY in backend/.env');
    }

    const client = this.getClient();
    const model = 'claude-sonnet-4-20250514';

    logger.info('Anthropic analysis request', { model, analysisType: request.analysisType });

    // Build the user message content
    let userContent: string | Array<Anthropic.MessageParam['content'][0]>;

    if (request.chartImage && request.analysisType !== 'data') {
      // Vision analysis — include image
      // Extract base64 data and media type from data URL
      const mediaType = 'image/png'; // Default
      let base64Data = request.chartImage;

      if (request.chartImage.startsWith('data:')) {
        const match = request.chartImage.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          base64Data = match[2];
        }
      }

      userContent = [
        {
          type: 'text',
          text: request.prompt,
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
            data: base64Data,
          },
        },
      ];
    } else {
      // Text-only analysis
      userContent = request.prompt;
    }

    const response = await client.messages.create({
      model,
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.3,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent as any,
        },
      ],
    });

    // Extract text from response
    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Parse structured output
    const structured = parseAIOutput(content);

    return {
      reasoning: content,
      structured,
      model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
}
