import { Router } from 'express';
import { libraryController } from '../controllers/libraryController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All library routes require authentication
router.use(authenticate);

router.post('/liked-songs/:songId', (req, res, next) => libraryController.toggleLikeSong(req, res, next));
router.get('/liked-songs', (req, res, next) => libraryController.getLikedSongs(req, res, next));
router.post('/albums/:albumId', (req, res, next) => libraryController.toggleSaveAlbum(req, res, next));
router.get('/albums', (req, res, next) => libraryController.getSavedAlbums(req, res, next));
router.post('/artists/:artistId', (req, res, next) => libraryController.toggleFollowArtist(req, res, next));
router.get('/artists', (req, res, next) => libraryController.getFollowedArtists(req, res, next));
router.get('/history', (req, res, next) => libraryController.getListeningHistory(req, res, next));
router.delete('/history', (req, res, next) => libraryController.clearListeningHistory(req, res, next));

export default router;
