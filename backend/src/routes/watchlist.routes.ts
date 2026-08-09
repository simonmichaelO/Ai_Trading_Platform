/**
 * Watchlist Routes
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import * as watchlistController from '@controllers/watchlist.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /watchlist — List watchlist
router.get('/', watchlistController.list);

// POST /watchlist — Add to watchlist
router.post('/', watchlistController.add);

// DELETE /watchlist/:id — Remove from watchlist
router.delete('/:id', watchlistController.remove);

export default router;
