import { Router } from 'express';
import { z } from 'zod';
import { authController } from '../controllers/authController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

const registerSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    displayName: z.string().min(2, 'Display name must be at least 2 characters'),
    role: z.enum(['USER', 'CONTENT_MANAGER', 'ADMIN']).optional(),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }),
};

router.post('/register', authLimiter, validateRequest(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, validateRequest(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
router.patch('/me', authenticate, (req, res, next) => authController.updateMe(req, res, next));
router.delete('/me', authenticate, (req, res, next) => authController.deleteAccount(req, res, next));
router.post('/forgot-password', authLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', authLimiter, (req, res, next) => authController.resetPassword(req, res, next));

// Spotify OAuth PKCE & Session Routes
router.get('/spotify/login', optionalAuth, (req, res, next) => authController.spotifyLogin(req, res, next));
router.get('/spotify/callback', optionalAuth, (req, res, next) => authController.spotifyCallback(req, res, next));
router.get('/spotify/token', authenticate, (req, res, next) => authController.getSpotifyToken(req, res, next));
router.get('/spotify/status', authenticate, (req, res, next) => authController.getSpotifyStatus(req, res, next));
router.post('/spotify/disconnect', authenticate, (req, res, next) => authController.disconnectSpotify(req, res, next));

export default router;

