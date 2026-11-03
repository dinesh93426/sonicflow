import { Router } from 'express';
import authRoutes from './authRoutes.js';
import catalogRoutes from './catalogRoutes.js';
import libraryRoutes from './libraryRoutes.js';
import playlistRoutes from './playlistRoutes.js';
import playbackRoutes from './playbackRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SonicFlow API',
    version: '1.0.0',
    adFree: true,
  });
});

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/', catalogRoutes); // direct access for /songs, /artists, etc.
router.use('/library', libraryRoutes);
router.use('/playlists', playlistRoutes);
router.use('/playback', playbackRoutes);
router.use('/admin', adminRoutes);

export default router;
