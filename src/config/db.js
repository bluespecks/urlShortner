const mongoose = require('mongoose');

/**
 * Connect to MongoDB using Mongoose.
 * Reads MONGODB_URI from environment variables and propagates errors to the caller.
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const conn = await mongoose.connect(uri);
  console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
  return conn;
};

/**
 * Disconnect from MongoDB if a connection is active.
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
