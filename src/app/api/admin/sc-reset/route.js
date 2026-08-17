import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { logActivity } from "../../../../lib/activity";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

const RESET_MAX_ATTEMPTS = 10;
const RESET_WINDOW_MS = 10 * 60_000;

// Dev-only convenience: lets the /admin/sc/reset page pre-fill the setup key
// so you don't have to copy it from .env.local while testing locally. Never
// returns anything outside of local dev — production deployments (NODE_ENV
// === "production") still require the key to be entered by hand, which is
// what actually keeps this bootstrap/recovery endpoint from being a public
// "take over any account" button.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ setupKey: null });
  }
  return Response.json({ setupKey: process.env.ADMIN_SEED_PASSWORD || null });
}

// Secret admin bootstrap/recovery endpoint, paired with the page at
// /admin/sc/reset. Lets whoever holds ADMIN_SEED_PASSWORD (this deployment's
// env var, never request input) create the admin account or reset its
// password without shell/DB access. Same trust model as /api/admin/seed,
// just POST-based (keeps the setup key out of URLs/server logs) and lets
// the caller choose the new password instead of reusing the seed one.
export async function POST(request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`admin-sc-reset:${ip}`, { max: RESET_MAX_ATTEMPTS, windowMs: RESET_WINDOW_MS });
  if (!allowed) {
    return Response.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPassword) {
    return Response.json(
      { error: "ADMIN_SEED_PASSWORD is not set in this deployment's environment variables." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const { setupKey, email, newPassword } = body || {};

  if (setupKey !== seedPassword) {
    return Response.json({ error: "Incorrect setup key." }, { status: 403 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid admin email address." }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 8) {
    return Response.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  await dbConnect();
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    existing.passwordHash = passwordHash;
    await existing.save();
    await logActivity({
      user: existing._id,
      actorRole: "system",
      action: "admin_password_reset",
      message: `Admin password reset for ${email} via /admin/sc/reset.`,
    });
    return Response.json({ result: `Password reset for ${email}. You can now log in at /admin/login.` });
  }

  const created = await User.create({
    uid: String(Math.floor(100000 + Math.random() * 900000)),
    email,
    passwordHash,
    inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
    role: "admin",
    balance: 0,
  });
  await logActivity({
    user: created._id,
    actorRole: "system",
    action: "admin_created",
    message: `Admin account created for ${email} via /admin/sc/reset.`,
  });
  return Response.json({ result: `Admin account created for ${email}. You can now log in at /admin/login.` });
}
