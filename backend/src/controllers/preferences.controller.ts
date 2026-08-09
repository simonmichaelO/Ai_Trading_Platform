/**
 * Preferences Controller
 * 
 * HTTP handlers for user preferences.
 * 
 * Endpoints:
 *   GET /preferences       → Get current preferences
 *   PUT /preferences       → Update preferences
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@middleware/auth';
import * as preferencesRepo from '@repositories/preferences.repository';
import { logger } from '@utils/logger';

/**
 * GET /preferences
 */
export async function get(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;

    let preferences = await preferencesRepo.getPreferences(user.id);

    // Create defaults if they don't exist yet
    if (!preferences) {
      preferences = await preferencesRepo.ensurePreferences(user.id);
    }

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error('get preferences failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch preferences.',
    });
  }
}

/**
 * PUT /preferences
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;

    const preferences = await preferencesRepo.updatePreferences(user.id, req.body);

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Preferences updated.',
    });
  } catch (error) {
    logger.error('update preferences failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to update preferences.',
    });
  }
}
