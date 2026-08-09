/**
 * AI Provider Interface
 * 
 * Defines the contract that all AI providers must implement.
 * This allows easy swapping between OpenAI, Anthropic, Gemini, etc.
 * 
 * To add a new provider:
 *   1. Create a new file in this directory
 *   2. Implement AIProvider interface
 *   3. Register it in ai.service.ts
 */

import type { AIProvider as AIProviderType, AnalysisType } from '@models/index';

// ──────────────────────────────────────────────
// AI Request & Response Types
// ──────────────────────────────────────────────

/**
 * Input to an AI analysis request.
 */
export interface AIAnalysisRequest {
  /** The user's prompt (built from strategy + market data) */
  prompt: string;

  /** System instructions */
  systemPrompt: string;

  /** Which type of analysis to perform */
  analysisType: AnalysisType;

  /** Optional: chart image as base64 data URL (for vision analysis) */
  chartImage?: string;

  /** Max tokens for the response */
  maxTokens?: number;

  /** Temperature (0-1, lower = more deterministic) */
  temperature?: number;
}

/**
 * Raw response from an AI provider.
 */
export interface AIAnalysisResponse {
  /** The AI's reasoning/analysis text */
  reasoning: string;

  /** Parsed structured output (trade levels, confidence, etc.) */
  structured: AIStructuredOutput;

  /** Which model was actually used */
  model: string;

  /** Token usage */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Structured output parsed from AI response.
 */
export interface AIStructuredOutput {
  direction: 'long' | 'short' | 'neutral';
  confidence: number;  // 0-1
  entry_price: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
  take_profit_2: number | null;
  take_profit_3: number | null;
  key_levels: Array<{
    type: 'support' | 'resistance' | 'order_block' | 'fvg' | 'liquidity';
    price: number;
    description: string;
  }>;
  reasoning_summary: string;
}

// ──────────────────────────────────────────────
// Provider Interface
// ──────────────────────────────────────────────

/**
 * Interface that all AI providers must implement.
 */
export interface AIProvider {
  /** Human-readable name */
  readonly name: string;

  /** Provider identifier (used in database) */
  readonly providerId: AIProviderType;

  /** Available models */
  readonly models: string[];

  /** Whether this provider supports vision (image analysis) */
  readonly supportsVision: boolean;

  /**
   * Perform a text analysis.
   */
  analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;

  /**
   * Check if this provider is configured and ready.
   */
  isAvailable(): boolean;
}

// ──────────────────────────────────────────────
// Output Parser
// ──────────────────────────────────────────────

/**
 * Parse structured output from AI response text.
 * Handles various formats the AI might return.
 */
export function parseAIOutput(text: string): AIStructuredOutput {
  // Default/fallback output
  const defaultOutput: AIStructuredOutput = {
    direction: 'neutral',
    confidence: 0.5,
    entry_price: null,
    stop_loss: null,
    take_profit_1: null,
    take_profit_2: null,
    take_profit_3: null,
    key_levels: [],
    reasoning_summary: text.substring(0, 500),
  };

  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/\{[\s\S]*"direction"[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      return {
        direction: parsed.direction || defaultOutput.direction,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        entry_price: parsed.entry_price || parsed.entry || null,
        stop_loss: parsed.stop_loss || parsed.sl || null,
        take_profit_1: parsed.take_profit_1 || parsed.tp1 || parsed.take_profit || null,
        take_profit_2: parsed.take_profit_2 || parsed.tp2 || null,
        take_profit_3: parsed.take_profit_3 || parsed.tp3 || null,
        key_levels: Array.isArray(parsed.key_levels) ? parsed.key_levels : [],
        reasoning_summary: parsed.reasoning_summary || parsed.summary || text.substring(0, 500),
      };
    }
  } catch {
    // JSON parsing failed — use the text as reasoning
  }

  // Try to extract direction from text
  const lowerText = text.toLowerCase();
  let direction: 'long' | 'short' | 'neutral' = 'neutral';
  if (lowerText.includes('bullish') || lowerText.includes('long') || lowerText.includes('buy')) {
    direction = 'long';
  } else if (lowerText.includes('bearish') || lowerText.includes('short') || lowerText.includes('sell')) {
    direction = 'short';
  }

  // Try to extract prices using regex
  const entryMatch = text.match(/entry[:\s]*\$?([\d.]+)/i);
  const slMatch = text.match(/stop[\s-]*loss[:\s]*\$?([\d.]+)/i);
  const tp1Match = text.match(/(?:take[\s-]*profit|tp)[\s-]*1?[:\s]*\$?([\d.]+)/i);

  return {
    ...defaultOutput,
    direction,
    entry_price: entryMatch ? parseFloat(entryMatch[1]) : null,
    stop_loss: slMatch ? parseFloat(slMatch[1]) : null,
    take_profit_1: tp1Match ? parseFloat(tp1Match[1]) : null,
  };
}
