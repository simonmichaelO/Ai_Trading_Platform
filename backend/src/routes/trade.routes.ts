/**
 * Trade Routes
 * 
 * Maps HTTP endpoints to trade controller functions.
 * All routes require authentication.
 * 
 * IMPORTANT: Static routes (stats) must come before :id routes.
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import * as tradeController from '@controllers/trade.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ──────────────────────────────────────────────
// Static routes (before :id)
// ──────────────────────────────────────────────

/** GET /trades/stats — Trading statistics */
router.get('/stats', tradeController.stats);

// ──────────────────────────────────────────────
// CRUD routes
// ──────────────────────────────────────────────

/** POST /trades — Open a new trade */
router.post('/', tradeController.create);

/** GET /trades — List trades */
router.get('/', tradeController.list);

/** GET /trades/:id — Get single trade */
router.get('/:id', tradeController.getById);

/** PUT /trades/:id — Update trade */
router.put('/:id', tradeController.update);

/** DELETE /trades/:id — Delete trade */
router.delete('/:id', tradeController.remove);

export default router;
