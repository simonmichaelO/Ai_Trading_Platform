/**
 * Analysis Routes
 * 
 * Maps HTTP endpoints to analysis controller functions.
 * All routes require authentication.
 * 
 * IMPORTANT: Static routes (providers) must come before :id routes.
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import * as analysisController from '@controllers/analysis.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ──────────────────────────────────────────────
// Static routes (before :id)
// ──────────────────────────────────────────────

/** GET /analysis/providers — List AI providers */
router.get('/providers', analysisController.getProviders);

// ──────────────────────────────────────────────
// CRUD routes
// ──────────────────────────────────────────────

/** POST /analysis — Run new analysis */
router.post('/', analysisController.create);

/** GET /analysis — List analyses */
router.get('/', analysisController.list);

/** GET /analysis/:id — Get single analysis */
router.get('/:id', analysisController.getById);

/** DELETE /analysis/:id — Delete analysis */
router.delete('/:id', analysisController.remove);

export default router;
