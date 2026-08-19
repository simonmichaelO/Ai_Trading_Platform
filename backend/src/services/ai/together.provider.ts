import OpenAI from 'openai';
import { AIProvider, AIAnalysisRequest, AIAnalysisResponse, parseAIOutput } from './ai-provider';
import config from '@config/index';
import { logger } from '@utils/logger';

const TOGETHER_BASE_URL = 'https://api.together.xyz/v1';

export class TogetherAIProvider implements AIProvider {
  readonly name = 'Together AI';
  readonly providerId = 'together' as const;
  readonly models = ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'];
  readonly supportsVision = false; 

  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = config.ai.together?.apiKey || process.env.TOGETHER_API_KEY || '';
      if (!apiKey) throw new Error('Together AI API key not configured. Set TOGETHER_API_KEY in backend/.env');
      this.client = new OpenAI({ apiKey, baseURL: TOGETHER_BASE_URL });
    }
    return this.client;
  }

  isAvailable(): boolean {
    const apiKey = config.ai.together?.apiKey || process.env.TOGETHER_API_KEY || '';
    return !!apiKey;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.isAvailable()) throw new Error('Together AI API key not configured');

    const client = this.getClient();
    const model = this.models[0];
    logger.info('Together AI analysis request', { model, analysisType: request.analysisType });

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
