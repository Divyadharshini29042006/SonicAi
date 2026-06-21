import { Router } from 'express';
import validateRequest from '../../middleware/validateRequest.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import {
  signupSchema,
  loginSchema,
  spotifyAuthSchema,
} from './auth.validation.js';
import {
  signup,
  login,
  spotifyAuth,
  refresh,
  logout,
} from './auth.controller.js';

const router = Router();

router.post('/signup', validateRequest(signupSchema), signup);
router.post('/login', validateRequest(loginSchema), login);
router.post('/spotify', validateRequest(spotifyAuthSchema), spotifyAuth);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);

export default router;
