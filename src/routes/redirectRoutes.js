const express = require('express');
const urlController = require('../controllers/urlController');

const router = express.Router();

// GET /:shortCode - Redirect to the original URL
router.get('/:shortCode', urlController.redirectToOriginalUrl);

module.exports = router;
