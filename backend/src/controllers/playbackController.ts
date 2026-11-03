import { Request, Response, NextFunction } from 'express';
import { playbackService } from '../services/playbackService.js';
import { spotifyService } from '../services/spotifyService.js';
import { successResponse } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';

export class PlaybackController {
  async recordEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await playbackService.recordEvent(
        req.user?.id,
        req.body,
        req.ip
      );
      return successResponse(res, result, 'Playback event recorded');
    } catch (error) {
      next(error);
    }
  }

  async getStreamUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { songId } = req.body;
      const result = await playbackService.getStreamUrl(songId, req.user?.id);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async streamAudio(req: Request, res: Response, next: NextFunction) {
    try {
      await playbackService.streamLocalAudio(req.params.id as string, req, res);
    } catch (error) {
      next(error);
    }
  }

  async playSpotifyTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { deviceId, uris, positionMs } = req.body;
      if (!deviceId) {
        throw new BadRequestError('Spotify deviceId is required');
      }
      const trackUris = Array.isArray(uris) ? uris : (uris ? [uris] : []);
      const result = await spotifyService.playOnDevice(
        req.user!.id,
        deviceId,
        trackUris,
        positionMs || 0
      );
      return successResponse(res, result, 'Playback initiated on Spotify device');
    } catch (error) {
      next(error);
    }
  }
}

export const playbackController = new PlaybackController();

