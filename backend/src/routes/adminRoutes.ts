import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { adminController } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { env } from '../config/env.js';
import { BadRequestError } from '../utils/errors.js';
import { successResponse } from '../utils/response.js';

const router = Router();

// Ensure upload directories exist
const audioDir = path.resolve(env.STORAGE_LOCAL_DIR, 'audio');
const artworkDir = path.resolve(env.STORAGE_LOCAL_DIR, 'art');
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(artworkDir, { recursive: true });

// Multer Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, audioDir);
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, artworkDir);
    } else {
      cb(new BadRequestError('Unsupported file type'), '');
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueKey = crypto.randomBytes(16).toString('hex');
    cb(null, `${uniqueKey}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`Invalid file format: ${file.mimetype}. Allowed: mp3, wav, ogg, jpg, png, webp`));
    }
  },
});

// Admin & Content Manager routes
router.use(authenticate);

// Dashboard
router.get('/dashboard', requireRole(['ADMIN', 'CONTENT_MANAGER']), (req, res, next) => adminController.getDashboard(req, res, next));

// Song management
router.post('/songs', requireRole(['ADMIN', 'CONTENT_MANAGER']), (req, res, next) => adminController.createSong(req, res, next));
router.patch('/songs/:id', requireRole(['ADMIN', 'CONTENT_MANAGER']), (req, res, next) => adminController.updateSong(req, res, next));
router.delete('/songs/:id', requireRole(['ADMIN', 'CONTENT_MANAGER']), (req, res, next) => adminController.deleteSong(req, res, next));

// Artist & Album management
router.post('/artists', requireRole(['ADMIN', 'CONTENT_MANAGER']), (req, res, next) => adminController.createArtist(req, res, next));
router.post('/albums', requireRole(['ADMIN', 'CONTENT_MANAGER']), (req, res, next) => adminController.createAlbum(req, res, next));

// Spotify Playlist Auto-Import & Download
router.post('/spotify-import', requireRole(['ADMIN', 'CONTENT_MANAGER']), (req, res, next) => adminController.spotifyImport(req, res, next));

// File Upload endpoint
router.post(
  '/upload',
  requireRole(['ADMIN', 'CONTENT_MANAGER']),
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      const isAudio = req.file.mimetype.startsWith('audio/');
      const relativeSubdir = isAudio ? 'audio' : 'art';
      const storageKey = path.join(relativeSubdir, req.file.filename);
      const publicUrl = isAudio 
        ? `/api/v1/playback/stream/${req.file.filename}` 
        : `/uploads/${relativeSubdir}/${req.file.filename}`;

      return successResponse(
        res,
        {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          storageKey,
          publicUrl,
        },
        'File uploaded successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }
);

// Admin-only User & Audit management
router.get('/users', requireRole(['ADMIN']), (req, res, next) => adminController.getUsers(req, res, next));
router.patch('/users/:id/role', requireRole(['ADMIN']), (req, res, next) => adminController.updateUserRole(req, res, next));
router.get('/audit-logs', requireRole(['ADMIN']), (req, res, next) => adminController.getAuditLogs(req, res, next));

export default router;
