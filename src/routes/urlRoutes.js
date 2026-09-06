const express = require('express');
const urlController = require('../controllers/urlController');

const router = express.Router();

// POST /api/urls - Shorten a URL
router.post('/', urlController.createShortUrl);

module.exports = router;
