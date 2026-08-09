/**
 * Market Data Routes
 * 
 * Maps HTTP endpoints to market data controller functions.
 * All routes require authentication.
 * 
 * Endpoints:
 *   GET  /market/providers       → List providers
 *   GET  /market/cache/stats     → Cache statistics
 *   POST /market/batch/prices    → Batch price fetch
 *   GET  /market/:symbol         → Single price
 *   GET  /market/:symbol/candles → Historical candles
 * 
 * NOTE: Static routes (providers, cache, batch) must be defined
 * BEFORE the dynamic :symbol route to avoid conflicts.
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import * as marketController from '@controllers/market.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ──────────────────────────────────────────────
// Static routes (must come before :symbol)
// ──────────────────────────────────────────────

/** GET /market/providers — List available providers */
router.get('/providers', marketController.getProviders);

/** GET /market/cache/stats — Cache statistics */
router.get('/cache/stats', marketController.getCacheStats);

/** POST /market/batch/prices — Batch price fetch */
router.post('/batch/prices', marketController.getBatchPrices);

// ──────────────────────────────────────────────
// Dynamic routes
// ──────────────────────────────────────────────

/** GET /market/:symbol — Current price */
router.get('/:symbol', marketController.getPrice);

/** GET /market/:symbol/candles — Historical candles */
router.get('/:symbol/candles', marketController.getCandles);

export default router;
