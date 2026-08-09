/**
 * Strategy Routes
 * 
 * Maps HTTP endpoints to strategy controller functions.
 * All routes require authentication.
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import * as strategyController from '@controllers/strategy.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /strategies — List all strategies
router.get('/', strategyController.list);

// POST /strategies — Create new strategy
router.post('/', strategyController.create);

// GET /strategies/:id — Get single strategy
router.get('/:id', strategyController.getById);

// PUT /strategies/:id — Update strategy
router.put('/:id', strategyController.update);

// DELETE /strategies/:id — Delete strategy
router.delete('/:id', strategyController.remove);

export default router;
