import { Router } from 'express';
import { playlistController } from '../controllers/playlistController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res, next) => playlistController.getPublicPlaylists(req, res, next));
router.get('/user/me', authenticate, (req, res, next) => playlistController.getUserPlaylists(req, res, next));
router.post('/', authenticate, (req, res, next) => playlistController.createPlaylist(req, res, next));
router.post('/import-spotify', authenticate, (req, res, next) => playlistController.importSpotify(req, res, next));

router.get('/:id', optionalAuth, (req, res, next) => playlistController.getPlaylistById(req, res, next));
router.patch('/:id', authenticate, (req, res, next) => playlistController.updatePlaylist(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => playlistController.deletePlaylist(req, res, next));

router.post('/:id/tracks', authenticate, (req, res, next) => playlistController.addTrack(req, res, next));
router.delete('/:id/tracks/:songId', authenticate, (req, res, next) => playlistController.removeTrack(req, res, next));
router.patch('/:id/tracks/reorder', authenticate, (req, res, next) => playlistController.reorderTracks(req, res, next));

export default router;
