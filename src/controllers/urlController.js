const Url = require('../models/Url');
const urlService = require('../services/urlService');

/**
 * Handle URL shortening requests.
 * Validates request payload and invokes urlService to create a shortened URL.
 */
const createShortUrl = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Request body must be a valid JSON object',
      });
    }

    const { originalUrl } = req.body;

    if (originalUrl === undefined || originalUrl === null) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'originalUrl is required',
      });
    }

    if (typeof originalUrl !== 'string') {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'originalUrl must be a string',
      });
    }

    const trimmedUrl = originalUrl.trim();

    if (!trimmedUrl) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'originalUrl cannot be empty',
      });
    }

    if (!Url.validateUrl(trimmedUrl)) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'originalUrl must be a valid HTTP or HTTPS URL',
      });
    }

    const result = await urlService.createShortUrl(trimmedUrl);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle short URL redirection requests.
 * Validates short code, performs database lookup with atomic click increment,
 * and redirects to originalUrl (or returns 404 if not found).
 */
const redirectToOriginalUrl = async (req, res, next) => {
  try {
    const rawCode = req.params.shortCode;
    const shortCode = typeof rawCode === 'string' ? rawCode.trim() : '';

    if (!shortCode) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Short URL not found',
      });
    }

    const urlDoc = await urlService.getOriginalUrlAndIncrementClicks(shortCode);

    if (!urlDoc) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Short URL not found',
      });
    }

    return res.redirect(302, urlDoc.originalUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShortUrl,
  redirectToOriginalUrl,
};
