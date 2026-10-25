import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createRequirement,
  getRequirement,
  getRequirementStats,
  listRequirements,
} from '../controllers/requirements.js';

export function createRequirementsRouter({ createLimit = 30 } = {}) {
  const router = Router();

  // Limits posting (not reading) per client IP to curb spam.
  const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: createLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many submissions, please try again later' } },
  });

  router.post('/', createLimiter, createRequirement);
  router.get('/', listRequirements);
  router.get('/stats', getRequirementStats);
  router.get('/:id', getRequirement);

  return router;
}
