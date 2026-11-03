import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { spotifyService } from '../services/spotifyService.js';
import { env } from '../config/env.js';
import { successResponse } from '../utils/response.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, displayName, role } = req.body;
      const result = await authService.register(
        { email, password, displayName, role },
        req.ip,
        req.headers['user-agent']
      );

      // Set secure HttpOnly cookie
      res.cookie('sonicflow_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return successResponse(res, result, 'Registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(
        { email, password },
        req.ip,
        req.headers['user-agent']
      );

      res.cookie('sonicflow_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return successResponse(res, result, 'Logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.sessionToken);
      res.clearCookie('sonicflow_token');
      return successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.updateProfile(req.user!.id, req.body);
      return successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.deleteAccount(req.user!.id);
      res.clearCookie('sonicflow_token');
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  // --- Spotify PKCE & Web API Endpoints ---

  async spotifyLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const returnUrl = (req.query.returnUrl as string) || '/library';
      // User can be authenticated via token in header, cookie, or query param
      const userId = req.user?.id || (req.query.userId as string);
      
      const authUrl = spotifyService.createAuthorizationUrl(userId, returnUrl);
      return res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async spotifyCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;

      if (error) {
        return res.redirect(`${env.CLIENT_URL}/library?spotify_error=${encodeURIComponent(error)}`);
      }

      if (!code || !state) {
        return res.redirect(`${env.CLIENT_URL}/library?spotify_error=missing_code_or_state`);
      }

      const result = await spotifyService.handleCallback(code, state, req.user?.id);
      return res.redirect(
        `${env.CLIENT_URL}${result.returnUrl}?spotify=connected&premium=${result.isPremium ? '1' : '0'}`
      );
    } catch (error: any) {
      console.error('Spotify callback error:', error);
      return res.redirect(
        `${env.CLIENT_URL}/library?spotify_error=${encodeURIComponent(error.message || 'auth_failed')}`
      );
    }
  }

  async getSpotifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = await spotifyService.getValidAccessToken(req.user!.id);
      return successResponse(res, { accessToken });
    } catch (error) {
      next(error);
    }
  }

  async getSpotifyStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
      return successResponse(res, {
        connected: user.isSpotifyConnected,
        product: user.spotifyProduct,
        isPremium: user.hasSpotifyPremium,
        spotifyUserId: user.spotifyUserId,
      });
    } catch (error) {
      next(error);
    }
  }

  async disconnectSpotify(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await spotifyService.disconnectSpotify(req.user!.id);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

