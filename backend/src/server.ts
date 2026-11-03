import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env.js';
import prisma from './config/prisma.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers with Audio Streaming Cross-Origin allowance
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Explicit CORS
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  })
);

// Logging & Body Parsers
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads serving (artworks and local public assets)
app.use('/uploads', express.static(env.STORAGE_LOCAL_DIR));

// Root Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    service: 'SonicFlow Platform Engine',
  });
});

import authRoutes from './routes/authRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';

// Top-level direct routes as required: /auth/spotify/* and /api/playlists/*
app.use('/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);

// Versioned API routes
app.use('/api/v1', apiRoutes);

// Centralized error handling
app.use(errorHandler);

// Server startup
const PORT = env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`🚀 SonicFlow API Server running at http://localhost:${PORT}`);
  console.log(`🎵 Ad-Free Streaming Engine active on /api/v1`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database connections closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
