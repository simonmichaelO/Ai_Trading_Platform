import OpenAI from 'openai';
import { AIProvider, AIAnalysisRequest, AIAnalysisResponse, parseAIOutput } from './ai-provider';
import config from '@config/index';
import { logger } from '@utils/logger';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterProvider implements AIProvider {
  readonly name = 'OpenRouter';
  readonly providerId = 'openrouter' as const;
  readonly models = ['meta-llama/llama-3.1-70b-instruct:free'];
  readonly supportsVision = false; 

  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = config.ai.openrouter?.apiKey || process.env.OPENROUTER_API_KEY || '';
      if (!apiKey) throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY in backend/.env');
      this.client = new OpenAI({ 
        apiKey, 
        baseURL: OPENROUTER_BASE_URL,
        defaultHeaders: { 'HTTP-Referer': 'https://ai-trading-platform.vercel.app', 'X-Title': 'AI Trading Platform' }
      });
    }
    return this.client;
  }

  isAvailable(): boolean {
    const apiKey = config.ai.openrouter?.apiKey || process.env.OPENROUTER_API_KEY || '';
    return !!apiKey;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.isAvailable()) throw new Error('OpenRouter API key not configured');

    const client = this.getClient();
    const model = this.models[0];
    logger.info('OpenRouter analysis request', { model, analysisType: request.analysisType });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.prompt }
    ];

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
