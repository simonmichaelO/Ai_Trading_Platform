# AI System Documentation

> Last updated: Phase 5 — AI Service Layer

## Overview

The AI system is modular and provider-agnostic. It supports:
- **OpenAI** (GPT-4o, GPT-4o-mini) — Text analysis
- **Anthropic** (Claude 3.5 Sonnet, Claude 3 Haiku) — Text + Vision
- **Google Gemini** (Gemini 1.5 Pro) — Text + Vision

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 AI Service Layer                 │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │         AI Provider Interface            │    │
│  │   (Common contract all providers use)    │    │
│  └──────────────────┬──────────────────────┘    │
│                     │                            │
│  ┌──────────┬───────┴───────┬──────────────┐   │
│  │          │               │              │   │
│  │ ┌──────┐ │  ┌──────────┐ │ ┌─────────┐ │   │
│  │ │OpenAI│ │  │ Anthropic│ │ │ Gemini  │ │   │
│  │ │      │ │  │ (Claude) │ │ │         │ │   │
│  │ └──────┘ │  └──────────┘ │ └─────────┘ │   │
│  └──────────┴───────────────┴──────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │           Analysis Types                 │    │
│  │  ├── Data Analysis (structured market)   │    │
│  │  ├── Vision Analysis (chart image)       │    │
│  │  └── Hybrid Analysis (both combined)     │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## Analysis Types

### 1. Data Analysis
- Input: Structured market data (OHLCV, indicators)
- Output: Text reasoning, trade levels, confidence score
- Providers: All three

### 2. Vision Analysis
- Input: Chart screenshot image
- Output: Detected patterns, annotated chart, trade levels
- Providers: Claude, Gemini (OpenAI vision available)

### 3. Hybrid Analysis
- Input: Market data + chart image
- Output: Combined analysis with both data reasoning and visual pattern detection
- Providers: Claude, Gemini (best quality)

## Vision Detection Capabilities

The AI Vision module can detect:
- Trend lines (support/resistance)
- Supply & Demand zones
- Order Blocks (OB)
- Fair Value Gaps (FVG)
- Break of Structure (BOS)
- Change of Character (CHOCH)
- Liquidity zones
- Inducements
- Premium/Discount zones
- Entry, Stop Loss, Take Profit levels

## Strategy Integration

Each strategy has a `prompt_template` that dynamically shapes the AI's analysis:
1. User selects a strategy
2. Strategy rules are injected into the AI prompt
3. AI analyzes using those specific rules
4. Output follows the strategy's framework

## Adding a New Provider

1. Create a new file in `backend/src/services/ai/` (e.g., `mistral.ts`)
2. Implement the `AIProvider` interface
3. Register it in the AI service factory
4. Add config in `config/index.ts`
5. No other code changes needed

## Cost Estimation

| Provider | Model | Cost per Analysis (approx) |
|----------|-------|--------------------------|
| OpenAI | GPT-4o | $0.01–0.05 |
| OpenAI | GPT-4o-mini | $0.001–0.005 |
| Anthropic | Claude 3.5 Sonnet | $0.01–0.03 |
| Anthropic | Claude 3 Haiku | $0.001–0.003 |
| Google | Gemini 1.5 Pro | $0.005–0.02 |

**Estimated monthly cost** (50 analyses/day): $15–45/month depending on provider and model.
