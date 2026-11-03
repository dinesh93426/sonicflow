import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import prisma from '../src/config/prisma.js';

describe('SonicFlow REST API Test Suite', () => {
  let authToken = '';
  let songId = '';
  let playlistId = '';

  beforeAll(async () => {
    // Fetch a seeded song for tests
    const song = await prisma.song.findFirst();
    if (song) {
      songId = song.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('SonicFlow');
  });

  it('GET /api/v1/health returns ad-free status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.adFree).toBe(true);
  });

  describe('Authentication Flows', () => {
    const testEmail = `test_${Date.now()}@sonicflow.app`;

    it('POST /api/v1/auth/register registers a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: 'TestPassword123!',
          displayName: 'Tester User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.token).toBeDefined();
    });

    it('POST /api/v1/auth/login logs in user and provides token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
    });

    it('POST /api/v1/auth/login rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/auth/me returns authenticated profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testEmail);
    });
  });

  describe('Catalog & Search Flows', () => {
    it('GET /api/v1/songs returns list of available tracks', async () => {
      const res = await request(app).get('/api/v1/songs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/genres returns all music genres', async () => {
      const res = await request(app).get('/api/v1/genres');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/search finds tracks and artists by keyword', async () => {
      const res = await request(app).get('/api/v1/search?q=Solar');
      expect(res.status).toBe(200);
      expect(res.body.data.songs).toBeDefined();
      expect(res.body.data.artists).toBeDefined();
    });
  });

  describe('Playback & Streaming Flows', () => {
    it('POST /api/v1/playback/stream-url returns stream endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/playback/stream-url')
        .send({ songId });

      expect(res.status).toBe(200);
      expect(res.body.data.streamUrl).toBeDefined();
    });

    it('GET /api/v1/playback/stream/:id streams real audio bytes with 200/206', async () => {
      const res = await request(app)
        .get(`/api/v1/playback/stream/${songId}`)
        .set('Range', 'bytes=0-1023');

      expect([200, 206]).toContain(res.status);
      expect(res.header['content-type']).toContain('audio');
    });

    it('POST /api/v1/playback/events records playback and updates play metric', async () => {
      const res = await request(app)
        .post('/api/v1/playback/events')
        .send({
          songId,
          eventType: 'COMPLETE',
          playedDuration: 35,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.recorded).toBe(true);
    });
  });

  describe('Playlists & Library Flows', () => {
    it('POST /api/v1/playlists creates a new user playlist', async () => {
      const res = await request(app)
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'My Custom Night Vibes',
          description: 'Custom curated ad-free playlist',
          isPublic: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('My Custom Night Vibes');
      playlistId = res.body.data.id;
    });

    it('POST /api/v1/playlists/:id/tracks adds track to playlist', async () => {
      const res = await request(app)
        .post(`/api/v1/playlists/${playlistId}/tracks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ songId });

      expect(res.status).toBe(201);
      expect(res.body.data.songId).toBe(songId);
    });

    it('POST /api/v1/library/liked-songs/:songId toggles like on a track', async () => {
      const res = await request(app)
        .post(`/api/v1/library/liked-songs/${songId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isLiked).toBe(true);
    });
  });
});
