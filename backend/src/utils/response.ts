import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
  errors?: any;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, any>
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(payload);
};

export const errorResponse = (
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors?: any
): Response => {
  const payload: ApiResponse<null> = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(payload);
};
