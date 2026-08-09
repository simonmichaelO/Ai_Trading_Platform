/**
 * Strategy Controller
 * 
 * HTTP handlers for strategy CRUD operations.
 * 
 * Endpoints:
 *   GET    /strategies       → List all strategies
 *   POST   /strategies       → Create new strategy
 *   GET    /strategies/:id   → Get single strategy
 *   PUT    /strategies/:id   → Update strategy
 *   DELETE /strategies/:id   → Delete strategy
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@middleware/auth';
import * as strategyRepo from '@repositories/strategy.repository';
import { logger } from '@utils/logger';

/**
 * GET /strategies
 * List all strategies for the authenticated user.
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const enabledOnly = req.query.enabledOnly === 'true';

    const strategies = await strategyRepo.listStrategies(user.id, { enabledOnly });

    res.status(200).json({
      success: true,
      data: strategies,
    });
  } catch (error) {
    logger.error('list strategies failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch strategies.',
    });
  }
}

/**
 * GET /strategies/:id
 * Get a single strategy by ID.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    const strategy = await strategyRepo.getStrategyById(id, user.id);

    if (!strategy) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Strategy not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: strategy,
    });
  } catch (error) {
    logger.error('get strategy failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch strategy.',
    });
  }
}

/**
 * POST /strategies
 * Create a new strategy.
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { name, description, entry_rules, exit_rules, risk_rules, indicators, prompt_template, is_enabled } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Strategy name is required.',
      });
      return;
    }

    const strategy = await strategyRepo.createStrategy(user.id, {
      name: name.trim(),
      description,
      entry_rules,
      exit_rules,
      risk_rules,
      indicators,
      prompt_template,
      is_enabled,
    });

    res.status(201).json({
      success: true,
      data: strategy,
      message: 'Strategy created successfully.',
    });
  } catch (error) {
    logger.error('create strategy failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to create strategy.',
    });
  }
}

/**
 * PUT /strategies/:id
 * Update an existing strategy.
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    const strategy = await strategyRepo.updateStrategy(id, user.id, req.body);

    if (!strategy) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Strategy not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: strategy,
      message: 'Strategy updated successfully.',
    });
  } catch (error) {
    logger.error('update strategy failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to update strategy.',
    });
  }
}

/**
 * DELETE /strategies/:id
 * Delete a strategy.
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    // Check if strategy exists first
    const existing = await strategyRepo.getStrategyById(id, user.id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Strategy not found.',
      });
      return;
    }

    // Don't allow deleting the default strategy
    if (existing.is_default) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot delete the default strategy. Set another strategy as default first.',
      });
      return;
    }

    await strategyRepo.deleteStrategy(id, user.id);

    res.status(200).json({
      success: true,
      message: 'Strategy deleted successfully.',
    });
  } catch (error) {
    logger.error('delete strategy failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to delete strategy.',
    });
  }
}
