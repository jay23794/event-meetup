import rateLimit from 'express-rate-limit';

export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  max: number = 100
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });
};

export const globalLimiter = createRateLimiter();

export const authLimiter = createRateLimiter(15 * 60 * 1000, 5);

export const scanRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req as any).user?.id || req.ip,
  message: 'Too many scans, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});
