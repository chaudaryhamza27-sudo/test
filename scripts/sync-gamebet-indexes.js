// One-off: drops the old {round,user} unique index on gamebets so the new
// {round,user,slot} index (added for dual bet panels) can take effect.
// Usage: node scripts/sync-gamebet-indexes.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not set in .env.local");

  await mongoose.connect(mongoUri);
  const collection = mongoose.connection.collection("gamebets");
  const indexes = await collection.indexes();

  for (const idx of indexes) {
    const keys = Object.keys(idx.key);
    if (idx.unique && keys.length === 2 && keys.includes("round") && keys.includes("user") && !keys.includes("slot")) {
      console.log(`Dropping stale index ${idx.name}`);
      await collection.dropIndex(idx.name);
    }
  }

  console.log("Done. Current indexes:", (await collection.indexes()).map((i) => i.name));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
