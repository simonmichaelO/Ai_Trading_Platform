/**
 * Authentication Middleware
 * 
 * Verifies that every request to protected routes has a valid
 * Supabase JWT token in the Authorization header.
 * 
 * Flow:
 *   1. Extract Bearer token from Authorization header
 *   2. Verify token with Supabase (validates signature, expiry, claims)
 *   3. Attach user info to request object
 *   4. Continue to controller
 * 
 * If token is invalid/missing → 401 Unauthorized
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '@config/index';
import { logger } from '@utils/logger';

// ──────────────────────────────────────────────
// Extend Express Request to include user info
// ──────────────────────────────────────────────

/**
 * The authenticated user's data, attached to every request
 * that passes through the auth middleware.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Extended Request type that includes the authenticated user.
 * Use this in controllers that require authentication.
 */
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// ──────────────────────────────────────────────
// Supabase client for token verification
// ──────────────────────────────────────────────

/**
 * We use the ANON key here (not service_role) because we're only
 * verifying user tokens — not performing admin operations.
 * This follows the principle of least privilege.
 */
const ws = require('ws');

const supabaseAuth = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.anonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      params: {
        transport: ws,
      },
    },
  }
);

// ──────────────────────────────────────────────
// Auth Middleware
// ──────────────────────────────────────────────

/**
 * Middleware that requires a valid authentication token.
 * 
 * Usage:
 *   router.get('/protected', authenticate, controller);
 *   router.get('/profile', authenticate, profileController);
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token || token === '' || token === 'undefined') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token is empty or invalid.',
      });
      return;
    }

    // 2. Verify the token with Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      logger.warn('Auth failed: invalid token', {
        error: error?.message,
        ip: req.ip,
        path: req.path,
      });

      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token. Please log in again.',
      });
      return;
    }

    // 3. Attach user info to the request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email || '',
      role: user.role || 'authenticated',
    };

    // 4. Continue to the next middleware/controller
    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });

    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Authentication check failed. Please try again.',
    });
  }
}

/**
 * Optional auth middleware — attaches user if token is valid,
 * but doesn't block the request if there's no token.
 * 
 * Useful for endpoints that work for both authenticated and anonymous users.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token — continue without user info
      next();
      return;
    }

    const token = authHeader.substring(7);
    const { data: { user } } = await supabaseAuth.auth.getUser(token);

    if (user) {
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email || '',
        role: user.role || 'authenticated',
      };
    }

    next();
  } catch (error) {
    // Don't block the request — just continue without auth
    logger.warn('Optional auth check failed', { error });
    next();
  }
}
