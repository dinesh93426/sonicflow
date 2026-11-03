import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService.js';
import { spotifyService } from '../services/spotifyService.js';
import { BadRequestError } from '../utils/errors.js';
import { successResponse } from '../utils/response.js';

export class AdminController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await adminService.getDashboardMetrics();
      return successResponse(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  async createSong(req: Request, res: Response, next: NextFunction) {
    try {
      const song = await adminService.createSong(req.user!.id, req.body, req.ip);
      return successResponse(res, song, 'Song created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSong(req: Request, res: Response, next: NextFunction) {
    try {
      const song = await adminService.updateSong(req.params.id as string, req.user!.id, req.body, req.ip);
      return successResponse(res, song, 'Song updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteSong(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteSong(req.params.id as string, req.user!.id, req.ip);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async createArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const artist = await adminService.createArtist(req.user!.id, req.body, req.ip);
      return successResponse(res, artist, 'Artist created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async createAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const album = await adminService.createAlbum(req.user!.id, req.body, req.ip);
      return successResponse(res, album, 'Album created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await adminService.getUsers(page, limit);
      return successResponse(res, result.users, 'Users fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const user = await adminService.updateUserRole(req.params.id as string, role, req.user!.id, req.ip);
      return successResponse(res, user, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await adminService.getAuditLogs(page, limit);
      return successResponse(res, result.logs, 'Audit logs fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async spotifyImport(req: Request, res: Response, next: NextFunction) {
    try {
      const { spotifyUrl, maxTracks } = req.body;
      if (!spotifyUrl) {
        throw new BadRequestError('Spotify playlist link is required');
      }
      const result = await spotifyService.importPlaylist(
        spotifyUrl,
        req.user!.id
      );
      return successResponse(res, result, result.message, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
