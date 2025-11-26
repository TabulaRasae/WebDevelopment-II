import mongoose from "mongoose";

const mongoUri =
  process.env.MONGODB_URL ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/cis485";

const globalCache = globalThis._mongooseCache || { conn: null, promise: null };
globalThis._mongooseCache = globalCache;

export async function connectDB() {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
  mongoose.Promise = global.Promise;
  globalCache.promise = mongoose.connect(mongoUri, {
    bufferCommands: false,
  });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

export default connectDB;
