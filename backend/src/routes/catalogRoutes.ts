import { Router } from 'express';
import { catalogController } from '../controllers/catalogController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/songs', (req, res, next) => catalogController.getSongs(req, res, next));
router.get('/songs/:id', optionalAuth, (req, res, next) => catalogController.getSongById(req, res, next));
router.get('/artists', (req, res, next) => catalogController.getArtists(req, res, next));
router.get('/artists/:id', optionalAuth, (req, res, next) => catalogController.getArtistById(req, res, next));
router.get('/albums', (req, res, next) => catalogController.getAlbums(req, res, next));
router.get('/albums/:id', optionalAuth, (req, res, next) => catalogController.getAlbumById(req, res, next));
router.get('/genres', (req, res, next) => catalogController.getGenres(req, res, next));
router.get('/search', (req, res, next) => catalogController.search(req, res, next));
router.get('/recommendations', optionalAuth, (req, res, next) => catalogController.getRecommendations(req, res, next));

export default router;
