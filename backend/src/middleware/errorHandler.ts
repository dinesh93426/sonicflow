import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Check if operational AppError
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.details);
  }

  // Handle Prisma Known Request Errors
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    return errorResponse(res, `A record with this ${target} already exists`, 409);
  }

  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found', 404);
  }

  // Handle Multer upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 'File size exceeds allowed limit', 400);
  }

  // Default internal server error (never leak sensitive stack in production)
  const isProduction = process.env.NODE_ENV === 'production';
  console.error('[Unhandled Error]', err);

  return errorResponse(
    res,
    isProduction ? 'Internal Server Error' : err.message || 'Unknown server error',
    500,
    isProduction ? undefined : err.stack
  );
};
