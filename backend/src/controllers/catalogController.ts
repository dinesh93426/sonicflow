import { Request, Response, NextFunction } from 'express';
import { catalogService } from '../services/catalogService.js';
import { recommendationService } from '../services/recommendationService.js';
import { successResponse } from '../utils/response.js';

export class CatalogController {
  async getSongs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const genre = req.query.genre as string;
      const artistId = req.query.artistId as string;
      const albumId = req.query.albumId as string;
      const sortBy = req.query.sortBy as 'latest' | 'popular' | 'title';

      const result = await catalogService.getSongs({ page, limit, genre, artistId, albumId, sortBy });
      return successResponse(res, result.songs, 'Songs fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getSongById(req: Request, res: Response, next: NextFunction) {
    try {
      const song = await catalogService.getSongById(req.params.id as string, req.user?.id);
      return successResponse(res, song);
    } catch (error) {
      next(error);
    }
  }

  async getArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const query = req.query.q as string;

      const result = await catalogService.getArtists({ page, limit, query });
      return successResponse(res, result.artists, 'Artists fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getArtistById(req: Request, res: Response, next: NextFunction) {
    try {
      const artist = await catalogService.getArtistById(req.params.id as string, req.user?.id);
      return successResponse(res, artist);
    } catch (error) {
      next(error);
    }
  }

  async getAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const artistId = req.query.artistId as string;

      const result = await catalogService.getAlbums({ page, limit, artistId });
      return successResponse(res, result.albums, 'Albums fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getAlbumById(req: Request, res: Response, next: NextFunction) {
    try {
      const album = await catalogService.getAlbumById(req.params.id as string, req.user?.id);
      return successResponse(res, album);
    } catch (error) {
      next(error);
    }
  }

  async getGenres(_req: Request, res: Response, next: NextFunction) {
    try {
      const genres = await catalogService.getGenres();
      return successResponse(res, genres);
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const results = await catalogService.search(q || '', limit);
      return successResponse(res, results);
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const songs = await recommendationService.getRecommendations(req.user?.id, limit);
      return successResponse(res, songs);
    } catch (error) {
      next(error);
    }
  }
}

export const catalogController = new CatalogController();
