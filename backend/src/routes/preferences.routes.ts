/**
 * Preferences Routes
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import * as preferencesController from '@controllers/preferences.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /preferences — Get current preferences
router.get('/', preferencesController.get);

// PUT /preferences — Update preferences
router.put('/', preferencesController.update);

export default router;
