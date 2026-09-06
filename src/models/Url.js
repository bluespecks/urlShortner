const mongoose = require('mongoose');

/**
 * Validate that a given string is a valid HTTP or HTTPS URL.
 * Accepts standard web URLs while rejecting javascript:, ftp:, and malformed strings.
 *
 * @param {string} value
 * @returns {boolean}
 */
const validateUrl = (value) => {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
};

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
      validate: {
        validator: validateUrl,
        message: 'Original URL must be a valid HTTP or HTTPS URL',
      },
    },
    shortCode: {
      type: String,
      required: [true, 'Short code is required'],
      unique: true,
      index: true,
      trim: true,
    },
    clicks: {
      type: Number,
      default: 0,
      min: [0, 'Clicks cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;
