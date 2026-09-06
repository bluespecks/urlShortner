const crypto = require('crypto');

// URL-safe character set: 62 alphanumeric characters (a-z, A-Z, 0-9)
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DEFAULT_LENGTH = 6;

/**
 * Generate a random, URL-safe short code.
 *
 * @param {number} [length=6] - Desired length of the short code (default: 6).
 * @returns {string} A randomly generated URL-safe short code.
 */
function generateShortCode(length = DEFAULT_LENGTH) {
  const codeLength = typeof length === 'number' && length > 0 ? Math.floor(length) : DEFAULT_LENGTH;
  let code = '';

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = crypto.randomInt(0, ALPHABET.length);
    code += ALPHABET[randomIndex];
  }

  return code;
}

module.exports = generateShortCode;
