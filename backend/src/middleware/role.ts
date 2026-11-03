import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export const requireRole = (allowedRoles: ('USER' | 'CONTENT_MANAGER' | 'ADMIN')[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: requires one of [${allowedRoles.join(', ')}] role`
        )
      );
    }

    next();
  };
};
