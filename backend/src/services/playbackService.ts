import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export interface PlaybackEventDTO {
  songId: string;
  eventType: 'PLAY' | 'PAUSE' | 'SEEK' | 'COMPLETE' | 'ERROR';
  playedDuration?: number; // seconds listened so far
  totalDuration?: number;
}

export class PlaybackService {
  async recordEvent(userId: string | undefined, data: PlaybackEventDTO, ipAddress?: string) {
    const song = await prisma.song.findUnique({ where: { id: data.songId } });
    if (!song) {
      throw new NotFoundError('Song not found');
    }

    // Record the raw playback event
    await prisma.playbackEvent.create({
      data: {
        userId,
        songId: data.songId,
        eventType: data.eventType,
        ipAddress,
      },
    });

    // Check if qualifies as a legitimate play:
    // Rule: listened to >= 30 seconds OR >= 50% of track, and is eventType COMPLETE or playedDuration threshold
    const qualifiesAsPlay =
      (data.playedDuration && data.playedDuration >= 30) ||
      (data.eventType === 'COMPLETE' && (!data.playedDuration || data.playedDuration >= 15));

    if (qualifiesAsPlay) {
      // Increment aggregate song play count
      await prisma.song.update({
        where: { id: data.songId },
        data: { playCount: { increment: 1 } },
      });

      // Record in user listening history if logged in
      if (userId) {
        await prisma.listeningHistory.create({
          data: {
            userId,
            songId: data.songId,
            playedDuration: data.playedDuration || song.duration,
            completed: data.eventType === 'COMPLETE',
          },
        });
      }
    }

    return { recorded: true, qualified: qualifiesAsPlay };
  }

  async getStreamUrl(songId: string, _userId?: string) {
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song || !song.isAvailable) {
      throw new NotFoundError('Song not found or unavailable');
    }

    // In local storage mode, return the authenticated streaming endpoint URL
    if (env.STORAGE_PROVIDER === 'local') {
      return {
        streamUrl: `/api/v1/playback/stream/${song.id}`,
        contentType: 'audio/mpeg',
        duration: song.duration,
      };
    }

    // In S3 mode, return a signed URL or CDN URL
    return {
      streamUrl: song.audioUrl || `/api/v1/playback/stream/${song.id}`,
      contentType: 'audio/mpeg',
      duration: song.duration,
    };
  }

  async streamLocalAudio(songId: string, req: Request, res: Response) {
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song || !song.isAvailable) {
      throw new NotFoundError('Song not found or unavailable');
    }

    if (!song.storageKey) {
      throw new BadRequestError('This track is streamed directly via the Spotify Web Playback SDK');
    }

    let filePath: string = song.storageKey;
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(env.STORAGE_LOCAL_DIR, filePath);
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('Audio source file not found on server storage');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // HTTP Byte-Range support for audio scrubbing & seeking
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable: ${start} >= ${fileSize}`);
        return;
      }

      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      };

      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }
}

export const playbackService = new PlaybackService();
