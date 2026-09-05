const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

let server;

async function startServer() {
  // Connect to database if URI is provided
  await connectDB();

  // Start HTTP server
  server = app.listen(PORT, () => {
    console.log(`[Server] Shortly server running on port ${PORT}`);
    console.log(`[Server] Base URL configured as: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
    if (server) {
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });
    } else {
      await disconnectDB();
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('[Server] Fatal error during startup:', err);
  process.exit(1);
});
