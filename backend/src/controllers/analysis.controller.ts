/**
 * Analysis Controller
 * 
 * HTTP handlers for AI analysis operations.
 * 
 * Endpoints:
 *   POST   /analysis          → Run new analysis
 *   GET    /analysis          → List analyses
 *   GET    /analysis/:id      → Get analysis details
 *   DELETE /analysis/:id      → Delete analysis
 *   GET    /analysis/providers → List AI providers
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@middleware/auth';
import * as analysisService from '@services/analysis/analysis.service';
import * as analysisRepo from '@repositories/analysis.repository';
import { logger } from '@utils/logger';
import type { AIProvider, AnalysisType } from '@models/index';

/**
 * POST /analysis
 * Run a new AI analysis.
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { symbol, timeframe, provider, analysis_type, strategy_id, chart_image, market_type } = req.body;

    // Validate required fields
    if (!symbol || typeof symbol !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Symbol is required.',
      });
      return;
    }

    if (!timeframe || typeof timeframe !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Timeframe is required (e.g., "1h", "4h", "1d").',
      });
      return;
    }

    const validProviders: AIProvider[] = ['openai', 'anthropic', 'gemini', 'together', 'openrouter'];
    const selectedProvider: AIProvider = (provider && validProviders.includes(provider)) ? provider : 'openai';

    const validTypes: AnalysisType[] = ['data', 'vision', 'hybrid'];
    const selectedType: AnalysisType = (analysis_type && validTypes.includes(analysis_type)) ? analysis_type : 'data';

    // Run the analysis
    const result = await analysisService.runAnalysis({
      userId: user.id,
      symbol: symbol.toUpperCase(),
      timeframe,
      marketType: market_type,
      provider: selectedProvider,
      analysisType: selectedType,
      strategyId: strategy_id,
      chartImage: chart_image,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Analysis complete.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';

    if (message.includes('No AI provider') || message.includes('not configured')) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message,
      });
      return;
    }

    logger.error('Analysis failed', { error, userId: (req as AuthenticatedRequest).user?.id });
    res.status(500).json({
      success: false,
      error: 'Analysis Failed',
      message,
    });
  }
}

/**
 * GET /analysis
 * List analyses for the current user.
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);
    const symbol = req.query.symbol as string;
    const strategyId = req.query.strategyId as string;

    const result = await analysisRepo.listAnalyses(user.id, {
      page,
      limit,
      symbol,
      strategyId,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    logger.error('List analyses failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch analyses.',
    });
  }
}

/**
 * GET /analysis/:id
 * Get a single analysis.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    const analysis = await analysisRepo.getAnalysisById(id, user.id);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Analysis not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('Get analysis failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch analysis.',
    });
  }
}

/**
 * DELETE /analysis/:id
 * Delete an analysis.
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    const existing = await analysisRepo.getAnalysisById(id, user.id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Analysis not found.',
      });
      return;
    }

    await analysisRepo.deleteAnalysis(id, user.id);

    res.status(200).json({
      success: true,
      message: 'Analysis deleted.',
    });
  } catch (error) {
    logger.error('Delete analysis failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to delete analysis.',
    });
  }
}

/**
 * GET /analysis/providers
 * List available AI providers and their status.
 */
export async function getProviders(_req: Request, res: Response): Promise<void> {
  const providers = analysisService.getAvailableProviders();

  res.status(200).json({
    success: true,
    data: providers,
  });
}
