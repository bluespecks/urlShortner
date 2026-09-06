const express = require('express');
const urlController = require('../controllers/urlController');
const { shortenRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// POST /api/urls - Shorten a URL (rate-limited to 30 requests/minute per IP)
router.post('/', shortenRateLimiter, urlController.createShortUrl);

module.exports = router;
