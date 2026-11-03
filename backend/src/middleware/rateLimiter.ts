import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  message: {
    success: false,
    message: 'Too many requests, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const streamLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300, // generous for byte-range chunk requests
  message: {
    success: false,
    message: 'Too many streaming requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
