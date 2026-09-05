const dotenv = require('dotenv');

// Load environment variables using dotenv
dotenv.config();

const app = require('./app');

// Use process.env.PORT || 3000
const PORT = process.env.PORT || 3000;

// Start the HTTP server
const server = app.listen(PORT, () => {
  console.log(`[Server] Shortly server running on port ${PORT}`);
});

// Handle graceful shutdown for SIGTERM and SIGINT
const handleShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
