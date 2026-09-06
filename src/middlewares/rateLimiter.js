/**
 * In-memory rate limiter middleware for Express.
 * Tracks requests per IP address within a rolling window without external dependencies.
 *
 * @param {object} options
 * @param {number} [options.windowMs=60000] - Window duration in milliseconds (default: 1 min)
 * @param {number} [options.max=30] - Max allowed requests within the window (default: 30)
 * @param {string} [options.message] - Custom error message for 429 response
 * @returns {import('express').RequestHandler}
 */
const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 30;
  const message = options.message || 'Rate limit exceeded: maximum 30 URL shorten requests per minute';

  const hits = new Map();

  // Periodic cleanup of expired records to prevent memory accumulation
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, Math.max(windowMs, 60 * 1000));

  if (cleanup.unref) {
    cleanup.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = hits.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        error: 'TooManyRequests',
        message,
      });
    }

    next();
  };
};

const shortenRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Rate limit exceeded: maximum 30 URL shorten requests per minute',
});

module.exports = {
  createRateLimiter,
  shortenRateLimiter,
};
