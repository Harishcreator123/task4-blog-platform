const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_platform';

  try {
    // Attempt connecting to MongoDB with a short timeout to prevent blocking if mongod is not running
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ MongoDB connection to "${mongoURI}" failed (${error.message}).`);
    console.log(`📦 Activating embedded persistent database adapter for seamless offline / zero-setup execution.`);
    return false;
  }
};

const isMongooseConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  isMongooseConnected,
};
