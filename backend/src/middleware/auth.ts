import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import { UnauthorizedError } from '../utils/errors.js';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'CONTENT_MANAGER' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionToken?: string;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token = '';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.sonicflow_token) {
      token = req.cookies.sonicflow_token;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token required');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: 'USER' | 'CONTENT_MANAGER' | 'ADMIN';
      displayName: string;
    };

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, displayName: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found or has been deleted');
    }

    req.user = user as AuthUser;
    req.sessionToken = token;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Invalid or expired authentication token'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.sonicflow_token) {
      token = req.cookies.sonicflow_token;
    }

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        role: 'USER' | 'CONTENT_MANAGER' | 'ADMIN';
        displayName: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, displayName: true, role: true },
      });

      if (user) {
        req.user = user as AuthUser;
        req.sessionToken = token;
      }
    }
    next();
  } catch {
    // Optional auth silently continues for unauthenticated/guest users
    next();
  }
};
