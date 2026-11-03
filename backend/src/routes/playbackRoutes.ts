import { Router } from 'express';
import { playbackController } from '../controllers/playbackController.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import { streamLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/events', optionalAuth, (req, res, next) => playbackController.recordEvent(req, res, next));
router.post('/stream-url', optionalAuth, (req, res, next) => playbackController.getStreamUrl(req, res, next));
router.get('/stream/:id', streamLimiter, (req, res, next) => playbackController.streamAudio(req, res, next));
router.post('/spotify/play', authenticate, (req, res, next) => playbackController.playSpotifyTrack(req, res, next));

export default router;

