const express = require('express');
const urlRoutes = require('./routes/urlRoutes');

const app = express();

// Enable JSON request parsing
app.use(express.json());

// API routes
app.use('/api/urls', urlRoutes);

// Root endpoint: identifies the Shortly API
app.get('/', (req, res) => {
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
  console.error('[App Error]', err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred';

  if (err.name === 'ValidationError') {
    status = 400;
  }

  // Prevent exposing internal stack traces or database details for 5xx errors
  if (status >= 500) {
    message = 'An unexpected internal error occurred';
  }

  res.status(status).json({
    error: err.name || 'InternalServerError',
    message,
  });
});

module.exports = app;
