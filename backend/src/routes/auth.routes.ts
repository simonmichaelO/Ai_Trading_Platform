/**
 * Auth Routes
 * 
 * Maps HTTP endpoints to auth controller functions.
 * 
 * Routes:
 *   GET  /auth/health      → Public — auth system health check
 *   GET  /auth/me           → Protected — get current user
 *   POST /auth/initialize   → Protected — initialize new user
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { getMe, initialize, health } from '@controllers/auth.controller';

const router = Router();

// ──────────────────────────────────────────────
// Public routes (no auth required)
// ──────────────────────────────────────────────

/** Health check for auth system */
router.get('/health', health);

// ──────────────────────────────────────────────
// Protected routes (auth required)
// ──────────────────────────────────────────────

/** Get current authenticated user's profile */
router.get('/me', authenticate, getMe);

/** Initialize a new user's account (after first login) */
router.post('/initialize', authenticate, initialize);

export default router;
