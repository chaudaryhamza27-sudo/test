import mongoose from "mongoose";

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;

  // Read at call time, not module-load time — a standalone Node consumer
  // (realtime-server) loads .env.local itself after imports have already
  // resolved, since ES module imports are all evaluated before any of the
  // importing file's own top-level code runs.
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local");
  }

  if (!cached.promise) {
    // Explicit pool size: the Next.js app and the realtime-server run as two
    // separate Node processes, each with their own pool off this same
    // MONGODB_URI, so the real ceiling on concurrent DB work is roughly
    // 2x this number — keep it a deliberate, known value rather than
    // whatever the driver's default happens to be.
    cached.promise = mongoose.connect(MONGODB_URI, { maxPoolSize: 50, minPoolSize: 5 }).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
