/**
 * Prompt Builder
 * 
 * Constructs system prompts and user prompts for AI analysis.
 * Prompts incorporate:
 * - Strategy rules (entry, exit, risk)
 * - Market data (current price, candles, indicators)
 * - Output format instructions (for structured parsing)
 */

import type { MarketSnapshot, AIProvider } from '@models/index';

// ──────────────────────────────────────────────
// System Prompts (provider-specific tuning)
// ──────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are an expert trading analyst with deep knowledge of technical analysis, 
smart money concepts (SMC), and price action trading.

Your role is to analyze market data and provide professional-grade trading analysis.

IMPORTANT RULES:
- Be specific with price levels — never give vague answers
- Always provide a clear directional bias (bullish, bearish, or neutral)
- Include a confidence score between 0 and 1
- Provide concrete entry, stop loss, and take profit levels
- Explain your reasoning clearly and concisely
- Consider risk management in every analysis
- Never guarantee outcomes — markets are probabilistic

OUTPUT FORMAT:
End your response with a JSON block inside \`\`\`json code fences:

\`\`\`json
{
  "direction": "long" | "short" | "neutral",
  "confidence": 0.0 to 1.0,
  "entry_price": number or null,
  "stop_loss": number or null,
  "take_profit_1": number or null,
  "take_profit_2": number or null,
  "take_profit_3": number or null,
  "key_levels": [
    {
      "type": "support" | "resistance" | "order_block" | "fvg" | "liquidity",
      "price": number,
      "description": "brief description"
    }
  ],
  "reasoning_summary": "One-paragraph summary of your analysis"
}
\`\`\`

Before the JSON, provide your detailed reasoning and analysis.`;

const VISION_ADDENDUM = `

ADDITIONAL INSTRUCTIONS FOR CHART ANALYSIS:
When analyzing the chart image, look for and identify:
1. Market structure (higher highs/lows, trend direction)
2. Break of Structure (BOS) and Change of Character (CHOCH)
3. Order blocks (institutional entries)
4. Fair Value Gaps (FVG) / imbalances
5. Liquidity zones (where stop losses cluster)
6. Supply and demand zones
7. Key support and resistance levels

Mark these on the chart mentally and reference them in your analysis.
Be specific about price levels you observe in the chart.`;

// ──────────────────────────────────────────────
// Prompt Builder Functions
// ──────────────────────────────────────────────

/**
 * Strategy context to include in prompts.
 */
interface StrategyContext {
  name: string;
  description?: string;
  entry_rules?: string[];
  exit_rules?: string[];
  risk_rules?: string[];
  indicators?: string[];
  prompt_template?: string;
}

/**
 * Build the complete system prompt for an analysis.
 */
export function buildSystemPrompt(
  provider: AIProvider,
  strategy?: StrategyContext,
  includeVision: boolean = false
): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Add strategy-specific instructions
  if (strategy) {
    prompt += `\n\nSTRATEGY: ${strategy.name}`;
    
    if (strategy.description) {
      prompt += `\n${strategy.description}`;
    }

    if (strategy.prompt_template) {
      prompt += `\n\nSTRATEGY-SPECIFIC INSTRUCTIONS:\n${strategy.prompt_template}`;
    }

    if (strategy.entry_rules && strategy.entry_rules.length > 0) {
      prompt += `\n\nENTRY RULES (follow these):\n`;
      strategy.entry_rules.forEach((rule, i) => {
        prompt += `${i + 1}. ${rule}\n`;
      });
    }

    if (strategy.exit_rules && strategy.exit_rules.length > 0) {
      prompt += `\nEXIT RULES:\n`;
      strategy.exit_rules.forEach((rule, i) => {
        prompt += `${i + 1}. ${rule}\n`;
      });
    }

    if (strategy.risk_rules && strategy.risk_rules.length > 0) {
      prompt += `\nRISK RULES:\n`;
      strategy.risk_rules.forEach((rule, i) => {
        prompt += `${i + 1}. ${rule}\n`;
      });
    }

    if (strategy.indicators && strategy.indicators.length > 0) {
      prompt += `\n\nKEY INDICATORS TO CONSIDER: ${strategy.indicators.join(', ')}`;
    }
  }

  // Add vision instructions if analyzing a chart
  if (includeVision) {
    prompt += VISION_ADDENDUM;
  }

  return prompt;
}

/**
 * Build the user prompt with market data.
 */
export function buildUserPrompt(
  symbol: string,
  timeframe: string,
  marketSnapshot: MarketSnapshot,
  analysisType: 'data' | 'vision' | 'hybrid'
): string {
  let prompt = `Analyze the following market data:\n\n`;
  prompt += `Symbol: ${symbol}\n`;
  prompt += `Timeframe: ${timeframe}\n`;
  prompt += `Market Type: ${marketSnapshot.symbol.includes('/') ? (isForex(symbol) ? 'Forex' : isCrypto(symbol) ? 'Crypto' : 'Stocks') : 'Unknown'}\n\n`;

  // Current price
  prompt += `CURRENT PRICE DATA:\n`;
  prompt += `Open: ${formatNum(marketSnapshot.price.open)}\n`;
  prompt += `High: ${formatNum(marketSnapshot.price.high)}\n`;
  prompt += `Low: ${formatNum(marketSnapshot.price.low)}\n`;
  prompt += `Close: ${formatNum(marketSnapshot.price.close)}\n`;

  // Volume
  if (marketSnapshot.volume) {
    prompt += `Volume: ${marketSnapshot.volume.toLocaleString()}\n`;
  }

  // Candle data
  if (marketSnapshot.candles && marketSnapshot.candles.length > 0) {
    prompt += `\nRECENT CANDLES (${marketSnapshot.candles.length} candles):\n`;
    const recentCandles = marketSnapshot.candles.slice(-20); // Last 20 candles
    recentCandles.forEach((candle) => {
      const direction = candle.close >= candle.open ? '▲' : '▼';
      prompt += `${new Date(candle.time).toLocaleString()} | O:${formatNum(candle.open)} H:${formatNum(candle.high)} L:${formatNum(candle.low)} C:${formatNum(candle.close)} ${direction}\n`;
    });
  }

  // Indicators
  if (marketSnapshot.indicators && Object.keys(marketSnapshot.indicators).length > 0) {
    prompt += `\nINDICATORS:\n`;
    for (const [name, value] of Object.entries(marketSnapshot.indicators)) {
      if (Array.isArray(value)) {
        prompt += `${name}: [${value.slice(-5).map(v => formatNum(v)).join(', ')}]\n`;
      } else {
        prompt += `${name}: ${formatNum(value)}\n`;
      }
    }
  }

  // Analysis instructions
  prompt += `\n\nPROVIDE YOUR ANALYSIS:\n`;
  
  if (analysisType === 'data') {
    prompt += `Based on the market data above, analyze the current market condition and suggest:\n`;
    prompt += `1. Current market structure and trend\n`;
    prompt += `2. Key support and resistance levels\n`;
    prompt += `3. Recommended trade direction\n`;
    prompt += `4. Entry, stop loss, and take profit levels\n`;
    prompt += `5. Risk assessment and confidence level\n`;
  } else if (analysisType === 'vision') {
    prompt += `Analyze the chart image provided and identify:\n`;
    prompt += `1. Market structure and trend direction\n`;
    prompt += `2. Key patterns and formations visible\n`;
    prompt += `3. Important price levels\n`;
    prompt += `4. Suggested entry and exit points\n`;
  } else {
    // Hybrid
    prompt += `Using BOTH the market data and the chart image, provide a comprehensive analysis:\n`;
    prompt += `1. Confirm trend direction from data and chart\n`;
    prompt += `2. Identify key levels visible on chart with data confirmation\n`;
    prompt += `3. Suggest precise entry, stop loss, and take profit levels\n`;
    prompt += `4. Assess risk/reward ratio\n`;
    prompt += `5. Provide confidence level and reasoning\n`;
  }

  return prompt;
}

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function isForex(symbol: string): boolean {
  const forexPairs = ['EUR', 'GBP', 'USD', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
  const parts = symbol.split('/');
  return parts.length === 2 && forexPairs.includes(parts[0]) && forexPairs.includes(parts[1]);
}

function isCrypto(symbol: string): boolean {
  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
  const base = symbol.split('/')[0];
  return cryptoSymbols.includes(base);
}
