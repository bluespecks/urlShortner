const Url = require('../models/Url');
const urlService = require('../services/urlService');

// Valid short code regex: 3 to 30 alphanumeric characters, underscores, or hyphens
const SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

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
 * Validates short code format before querying MongoDB to prevent injection and malformed queries.
 * Looks up document by shortCode, increments clicks atomically, and redirects to originalUrl.
 */
const redirectToOriginalUrl = async (req, res, next) => {
  try {
    const rawCode = req.params.shortCode;
    const shortCode = typeof rawCode === 'string' ? rawCode.trim() : '';

    // Validate format before querying database
    if (!shortCode || !SHORT_CODE_REGEX.test(shortCode)) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid short code format',
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
  SHORT_CODE_REGEX,
};
