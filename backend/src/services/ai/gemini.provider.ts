/**
 * Google Gemini AI Provider
 * 
 * Uses Google's Gemini models for market analysis.
 * 
 * Models available:
 * - gemini-1.5-pro  — Best quality, supports vision
 * - gemini-1.5-flash — Fast, cheap, supports vision
 * 
 * 🔴 CHANGE THIS — Set GEMINI_API_KEY in backend/.env
 * Get your key from: https://makersuite.google.com/app/apikey
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIAnalysisRequest, AIAnalysisResponse } from './ai-provider';
import { parseAIOutput } from './ai-provider';
import config from '@config/index';
import { logger } from '@utils/logger';

const GEMINI_API_KEY = config.ai.gemini.apiKey || process.env.GEMINI_API_KEY || '';

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini';
  readonly providerId = 'gemini' as const;
  readonly models = ['gemini-1.5-pro', 'gemini-1.5-flash'];
  readonly supportsVision = true;

  private client: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      this.client = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
    return this.client;
  }

  isAvailable(): boolean {
    return !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here';
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in backend/.env');
    }

    const client = this.getClient();
    const modelName = 'gemini-1.5-pro';

    logger.info('Gemini analysis request', { model: modelName, analysisType: request.analysisType });

    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction: request.systemPrompt,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.3,
      },
    });

    let result;

    if (request.chartImage && request.analysisType !== 'data') {
      // Vision analysis — include image
      let base64Data = request.chartImage;
      let mimeType = 'image/png';

      if (request.chartImage.startsWith('data:')) {
        const match = request.chartImage.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }

      result = await model.generateContent([
        request.prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType as any,
          },
        },
      ]);
    } else {
      // Text-only analysis
      result = await model.generateContent(request.prompt);
    }

    const content = result.response.text();

    // Parse structured output
    const structured = parseAIOutput(content);

    // Gemini usage info is less detailed
    const usageMetadata = result.response.usageMetadata;

    return {
      reasoning: content,
      structured,
      model: modelName,
      usage: {
        promptTokens: usageMetadata?.promptTokenCount || 0,
        completionTokens: usageMetadata?.candidatesTokenCount || 0,
        totalTokens: usageMetadata?.totalTokenCount || 0,
      },
    };
  }
}
