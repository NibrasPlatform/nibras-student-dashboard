const mongoose = require("mongoose");

const buildMongoUri = () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const host = process.env.MONGODB_HOST || "localhost";
  const port = process.env.MONGODB_PORT || "27017";
  const dbName = process.env.MONGODB_DB || "nibras";
  const authSource = process.env.MONGODB_AUTH_SOURCE || "admin";
  const username = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;

  if (username && password) {
    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);
    return `mongodb://${encodedUser}:${encodedPass}@${host}:${port}/${dbName}?authSource=${authSource}`;
  }

  return `mongodb://${host}:${port}/${dbName}`;
};

const connectDB = async () => {
  try {
    const mongoUri = buildMongoUri();
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
