const express = require('express');

const app = express();

// Enable JSON request parsing
app.use(express.json());

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
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
  });
});

module.exports = app;
