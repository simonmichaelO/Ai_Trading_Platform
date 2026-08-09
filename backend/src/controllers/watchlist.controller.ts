/**
 * Watchlist Controller
 * 
 * HTTP handlers for watchlist management.
 * 
 * Endpoints:
 *   GET    /watchlist       → List watchlist
 *   POST   /watchlist       → Add symbol to watchlist
 *   DELETE /watchlist/:id   → Remove symbol from watchlist
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@middleware/auth';
import * as watchlistRepo from '@repositories/watchlist.repository';
import { logger } from '@utils/logger';

/**
 * GET /watchlist
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;

    const watchlist = await watchlistRepo.listWatchlist(user.id);

    res.status(200).json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    logger.error('list watchlist failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch watchlist.',
    });
  }
}

/**
 * POST /watchlist
 */
export async function add(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { symbol, market_type, notes } = req.body;

    if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Symbol is required.',
      });
      return;
    }

    if (!market_type || typeof market_type !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Market type is required (forex, crypto, stocks, indices).',
      });
      return;
    }

    const item = await watchlistRepo.addToWatchlist(
      user.id,
      symbol.trim().toUpperCase(),
      market_type,
      notes
    );

    res.status(201).json({
      success: true,
      data: item,
      message: `${symbol.toUpperCase()} added to watchlist.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add to watchlist.';

    if (message.includes('already in your watchlist')) {
      res.status(409).json({
        success: false,
        error: 'Conflict',
        message,
      });
      return;
    }

    logger.error('add to watchlist failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message,
    });
  }
}

/**
 * DELETE /watchlist/:id
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    await watchlistRepo.removeFromWatchlist(id, user.id);

    res.status(200).json({
      success: true,
      message: 'Removed from watchlist.',
    });
  } catch (error) {
    logger.error('remove from watchlist failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to remove from watchlist.',
    });
  }
}
