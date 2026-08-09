/**
 * Auth Controller
 * 
 * Handles HTTP requests for authentication-related operations.
 * 
 * Endpoints:
 *   GET /auth/me          → Get current user profile
 *   POST /auth/initialize → Initialize new user (after first login)
 *   GET /auth/health      → Check auth system health
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@middleware/auth';
import { getCurrentUser, initializeUser } from '@services/auth.service';
import { logger } from '@utils/logger';

/**
 * GET /auth/me
 * 
 * Returns the current authenticated user's profile.
 * The auth middleware has already verified the token and attached user info.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;

    const profile = await getCurrentUser(user.id);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User profile not found. Your account may have been deleted.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('getMe failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to retrieve user profile.',
    });
  }
}

/**
 * POST /auth/initialize
 * 
 * Called after first login to set up the user's account.
 * Creates default preferences, default strategy, etc.
 * Safe to call multiple times — only creates what's missing.
 */
export async function initialize(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;

    await initializeUser(user.id);

    res.status(200).json({
      success: true,
      message: 'User account initialized successfully.',
    });
  } catch (error) {
    logger.error('initialize failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to initialize user account.',
    });
  }
}

/**
 * GET /auth/health
 * 
 * Quick health check for the auth system.
 * Returns basic info without requiring authentication.
 */
export async function health(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: {
      auth: 'ok',
      message: 'Auth system is running',
      timestamp: new Date().toISOString(),
    },
  });
}
