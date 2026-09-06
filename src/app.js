const path = require('path');
const express = require('express');
const helmet = require('helmet');
const urlRoutes = require('./routes/urlRoutes');
const redirectRoutes = require('./routes/redirectRoutes');

const app = express();

// Security headers with development-friendly Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// Enable JSON request parsing
app.use(express.json());

// Serve static assets from public directory (styles.css, app.js)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// API routes
app.use('/api/urls', urlRoutes);

// Root endpoint: serves UI to browsers (text/html) and JSON metadata to API clients
app.get('/', (req, res) => {
  const accept = req.headers.accept || '';
  if (accept.includes('text/html')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  res.status(200).json({
    name: 'Shortly API',
    version: '1.0.0',
    description: 'Production-quality URL shortener service',
  });
});

// Health check endpoint: indicates that the server is healthy
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Shortly',
    timestamp: new Date().toISOString(),
  });
});

// Redirect route for short codes: mounted after /, /health, and /api/urls to prevent collision
app.use('/', redirectRoutes);

// JSON 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized JSON error-handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400) && 'body' in err) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Malformed JSON payload in request body',
    });
  }

  console.error('[App Error]', err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred';
  let errorName = err.name || 'InternalServerError';

  if (err.name === 'ValidationError') {
    status = 400;
    errorName = 'BadRequest';
  }

  if (status === 429) {
    errorName = 'TooManyRequests';
  }

  // Prevent exposing internal stack traces or database details for 5xx errors
  if (status >= 500) {
    errorName = 'InternalServerError';
    message = 'An unexpected internal error occurred';
  }

  res.status(status).json({
    error: errorName,
    message,
  });
});

module.exports = app;
