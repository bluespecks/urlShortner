const Url = require('../models/Url');
const generateShortCode = require('../utils/generateShortCode');

const MAX_COLLISION_RETRIES = 5;

/**
 * Shorten a long URL, persisting it to MongoDB with a unique short code.
 *
 * @param {string} originalUrl - The valid URL to be shortened.
 * @returns {Promise<{ originalUrl: string, shortCode: string, shortUrl: string }>}
 */
const createShortUrl = async (originalUrl) => {
  const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

  let attempts = 0;

  while (attempts < MAX_COLLISION_RETRIES) {
    const shortCode = generateShortCode();

    try {
      const urlDoc = new Url({
        originalUrl,
        shortCode,
      });

      await urlDoc.save();

      return {
        originalUrl: urlDoc.originalUrl,
        shortCode: urlDoc.shortCode,
        shortUrl: `${baseUrl}/${urlDoc.shortCode}`,
      };
    } catch (error) {
      // Check for MongoDB duplicate key collision on shortCode (E11000)
      const isDuplicateKey = error.code === 11000;
      const isShortCodeCollision = isDuplicateKey && (
        !error.keyPattern ||
        Boolean(error.keyPattern.shortCode) ||
        (typeof error.message === 'string' && error.message.includes('shortCode'))
      );

      if (isShortCodeCollision) {
        attempts += 1;
        if (attempts >= MAX_COLLISION_RETRIES) {
          const collisionError = new Error('Failed to generate a unique short code after multiple attempts');
          collisionError.status = 500;
          throw collisionError;
        }
        continue;
      }

      // Re-throw non-collision errors (e.g. connection drops or validation issues)
      throw error;
    }
  }
};

/**
 * Look up a URL document by its short code and atomically increment click count.
 *
 * @param {string} shortCode - The unique short code identifier.
 * @returns {Promise<import('mongoose').Document | null>} The updated URL document or null if not found.
 */
const getOriginalUrlAndIncrementClicks = async (shortCode) => {
  const urlDoc = await Url.findOneAndUpdate(
    { shortCode: String(shortCode) },
    { $inc: { clicks: 1 } },
    { returnDocument: 'after' }
  );

  return urlDoc;
};

module.exports = {
  createShortUrl,
  getOriginalUrlAndIncrementClicks,
};
