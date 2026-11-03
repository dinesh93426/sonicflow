import { Request, Response, NextFunction } from 'express';
import { playlistService } from '../services/playlistService.js';
import { spotifyService } from '../services/spotifyService.js';
import { successResponse } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';

export class PlaylistController {
  async importSpotify(req: Request, res: Response, next: NextFunction) {
    try {
      const url = req.body.url || req.body.spotifyUrl;
      if (!url) {
        throw new BadRequestError('Spotify playlist URL or URI is required in request body { url }');
      }

      const result = await spotifyService.importPlaylist(url, req.user!.id);
      return successResponse(res, result.playlist, result.message, 201, {
        importedTracksCount: result.importedTracksCount,
        catalogMatchedCount: result.catalogMatchedCount,
      });
    } catch (error) {
      next(error);
    }
  }

  async createPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const playlist = await playlistService.createPlaylist(req.user!.id, req.body);
      return successResponse(res, playlist, 'Playlist created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getUserPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
      const playlists = await playlistService.getUserPlaylists(req.user!.id);
      return successResponse(res, playlists);
    } catch (error) {
      next(error);
    }
  }

  async getPublicPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await playlistService.getPublicPlaylists(page, limit);
      return successResponse(res, result.playlists, 'Playlists fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getPlaylistById(req: Request, res: Response, next: NextFunction) {
    try {
      const playlist = await playlistService.getPlaylistById(req.params.id as string, req.user?.id);
      return successResponse(res, playlist);
    } catch (error) {
      next(error);
    }
  }

  async updatePlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const playlist = await playlistService.updatePlaylist(req.params.id as string, req.user!.id, req.body);
      return successResponse(res, playlist, 'Playlist updated');
    } catch (error) {
      next(error);
    }
  }

  async deletePlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await playlistService.deletePlaylist(req.params.id as string, req.user!.id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async addTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { songId } = req.body;
      const track = await playlistService.addTrackToPlaylist(req.params.id as string, songId, req.user!.id);
      return successResponse(res, track, 'Track added to playlist', 201);
    } catch (error) {
      next(error);
    }
  }

  async removeTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await playlistService.removeTrackFromPlaylist(req.params.id as string, req.params.songId as string, req.user!.id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async reorderTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackIds } = req.body;
      const result = await playlistService.reorderTracks(req.params.id as string, req.user!.id, trackIds);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const playlistController = new PlaylistController();

