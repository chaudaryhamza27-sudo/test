// Usage: node scripts/create-admin.js [email] [password]
// Falls back to ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD from .env.local.

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

  const email = process.argv[2] || process.env.ADMIN_SEED_EMAIL;
  const password = process.argv[3] || process.env.ADMIN_SEED_PASSWORD;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) throw new Error("MONGODB_URI is not set in .env.local");
  if (!email || !password) throw new Error("Provide an email and password, or set ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD in .env.local");

  await mongoose.connect(mongoUri);

  const UserSchema = new mongoose.Schema(
    {
      uid: String,
      phone: String,
      email: String,
      passwordHash: String,
      balance: Number,
      inviteCode: String,
      referredBy: String,
      role: String,
      isBanned: Boolean,
    },
    { timestamps: true }
  );
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    existing.passwordHash = await bcrypt.hash(password, 10);
    await existing.save();
    console.log(`Updated existing user ${email} to admin role.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      uid: String(Math.floor(100000 + Math.random() * 900000)),
      email,
      passwordHash,
      inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
      role: "admin",
      balance: 0,
    });
    console.log(`Created admin user ${email}.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
