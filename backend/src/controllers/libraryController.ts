import { Request, Response, NextFunction } from 'express';
import { libraryService } from '../services/libraryService.js';
import { successResponse } from '../utils/response.js';

export class LibraryController {
  async toggleLikeSong(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await libraryService.toggleLikeSong(req.user!.id, req.params.songId as string);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getLikedSongs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await libraryService.getLikedSongs(req.user!.id, page, limit);
      return successResponse(res, result.songs, 'Liked songs fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async toggleSaveAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await libraryService.toggleSaveAlbum(req.user!.id, req.params.albumId as string);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getSavedAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

      const result = await libraryService.getSavedAlbums(req.user!.id, page, limit);
      return successResponse(res, result.albums, 'Saved albums fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async toggleFollowArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await libraryService.toggleFollowArtist(req.user!.id, req.params.artistId as string);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getFollowedArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

      const result = await libraryService.getFollowedArtists(req.user!.id, page, limit);
      return successResponse(res, result.artists, 'Followed artists fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getListeningHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await libraryService.getListeningHistory(req.user!.id, page, limit);
      return successResponse(res, result.history, 'Listening history fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async clearListeningHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await libraryService.clearListeningHistory(req.user!.id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const libraryController = new LibraryController();
