const express = require('express');

const app = express();

// Standard middleware for parsing JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint to verify server status
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Shortly',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint with service metadata
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Shortly API',
    version: '1.0.0',
    description: 'Production-quality URL shortener service',
    health: '/health',
  });
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[App Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
  });
});

module.exports = app;
