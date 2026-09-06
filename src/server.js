const dotenv = require('dotenv');

// 1. Load environment variables
dotenv.config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

let server;

// Graceful shutdown handling for SIGINT and SIGTERM
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

// Server startup flow: Connect to DB first, then listen
async function startServer() {
  try {
    // 2. Connect to MongoDB
    await connectDB();

    // 3. Start HTTP server only after MongoDB connection succeeds
    server = app.listen(PORT, () => {
      console.log(`[Server] Shortly server running on port ${PORT}`);
      console.log(`[Server] Base URL configured as: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
    });
  } catch (error) {
    console.error(`[Server] Startup failed: ${error.message}`);
    process.exit(1);
  }
}

startServer();
