/**
 * Trade Controller
 * 
 * HTTP handlers for the trading journal.
 * 
 * Endpoints:
 *   POST   /trades          → Open a new trade
 *   GET    /trades          → List trades (paginated, filtered)
 *   GET    /trades/stats    → Trading statistics
 *   GET    /trades/:id      → Get trade details
 *   PUT    /trades/:id      → Update trade (close, add notes)
 *   DELETE /trades/:id      → Delete trade
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@middleware/auth';
import * as tradeRepo from '@repositories/trade.repository';
import { logger } from '@utils/logger';
import type { Direction, TradeStatus } from '@models/index';

/**
 * POST /trades
 * Open a new trade (journal entry).
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { symbol, direction, entry_price, stop_loss, take_profit, strategy_id, analysis_id, risk_reward_ratio, position_size, notes, tags, emotional_state } = req.body;

    // Validate required fields
    if (!symbol || typeof symbol !== 'string') {
      res.status(400).json({ success: false, error: 'Validation Error', message: 'Symbol is required.' });
      return;
    }

    if (!direction || !['long', 'short'].includes(direction)) {
      res.status(400).json({ success: false, error: 'Validation Error', message: 'Direction must be "long" or "short".' });
      return;
    }

    if (!entry_price || typeof entry_price !== 'number') {
      res.status(400).json({ success: false, error: 'Validation Error', message: 'Entry price is required.' });
      return;
    }

    const trade = await tradeRepo.createTrade(user.id, {
      symbol: symbol.toUpperCase(),
      direction: direction as Direction,
      entry_price,
      stop_loss,
      take_profit,
      strategy_id,
      analysis_id,
      risk_reward_ratio,
      position_size,
      notes,
      tags,
      emotional_state: emotional_state as any,
    });

    res.status(201).json({
      success: true,
      data: trade,
      message: 'Trade opened.',
    });
  } catch (error) {
    logger.error('Create trade failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to open trade.',
    });
  }
}

/**
 * GET /trades
 * List trades with pagination and filters.
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);
    const status = req.query.status as TradeStatus | undefined;
    const symbol = req.query.symbol as string;
    const strategyId = req.query.strategyId as string;

    const result = await tradeRepo.listTrades(user.id, {
      page,
      limit,
      status,
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
    logger.error('List trades failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch trades.',
    });
  }
}

/**
 * GET /trades/stats
 * Get trading statistics for the dashboard.
 */
export async function stats(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;

    const stats = await tradeRepo.getTradeStats(user.id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Trade stats failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch trade statistics.',
    });
  }
}

/**
 * GET /trades/:id
 * Get a single trade by ID.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    const trade = await tradeRepo.getTradeById(id, user.id);

    if (!trade) {
      res.status(404).json({ success: false, error: 'Not Found', message: 'Trade not found.' });
      return;
    }

    res.status(200).json({ success: true, data: trade });
  } catch (error) {
    logger.error('Get trade failed', { error });
    res.status(500).json({ success: false, error: 'Internal Error', message: 'Failed to fetch trade.' });
  }
}

/**
 * PUT /trades/:id
 * Update a trade (close it, add notes, etc.)
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    const trade = await tradeRepo.updateTrade(id, user.id, req.body);

    if (!trade) {
      res.status(404).json({ success: false, error: 'Not Found', message: 'Trade not found.' });
      return;
    }

    res.status(200).json({ success: true, data: trade, message: 'Trade updated.' });
  } catch (error) {
    logger.error('Update trade failed', { error });
    res.status(500).json({ success: false, error: 'Internal Error', message: 'Failed to update trade.' });
  }
}

/**
 * DELETE /trades/:id
 * Delete a trade.
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    const existing = await tradeRepo.getTradeById(id, user.id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Not Found', message: 'Trade not found.' });
      return;
    }

    await tradeRepo.deleteTrade(id, user.id);

    res.status(200).json({ success: true, message: 'Trade deleted.' });
  } catch (error) {
    logger.error('Delete trade failed', { error });
    res.status(500).json({ success: false, error: 'Internal Error', message: 'Failed to delete trade.' });
  }
}
