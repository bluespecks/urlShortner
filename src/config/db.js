const mongoose = require('mongoose');

/**
 * Connect to MongoDB instance using Mongoose.
 * @returns {Promise<typeof mongoose | null>}
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[Database] MONGODB_URI is not defined in environment variables. Database connection skipped.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] Connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB instance.
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
  } catch (error) {
    console.error(`[Database] Error during disconnect: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
