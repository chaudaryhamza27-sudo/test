import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

const SEED_MAX_ATTEMPTS = 10;
const SEED_WINDOW_MS = 10 * 60_000;

// One-time admin bootstrap for a deployment where you have no shell access to
// run scripts/create-admin.js directly (e.g. Vercel). Visit this URL once
// with ?password=<ADMIN_SEED_PASSWORD> to create/promote that account to
// admin using ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD from this deployment's own
// environment variables — never from request input, so this can only ever
// affect the one account the deployer configured.
//
// IMPORTANT: remove this route (or rotate ADMIN_SEED_PASSWORD) once you've
// used it — it's a standing endpoint as long as it exists.
export async function GET(request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`admin-seed:${ip}`, { max: SEED_MAX_ATTEMPTS, windowMs: SEED_WINDOW_MS });
  if (!allowed) {
    return Response.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    return Response.json(
      { error: "ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD are not set in this deployment's environment variables." },
      { status: 500 }
    );
  }

  const suppliedPassword = new URL(request.url).searchParams.get("password");
  if (suppliedPassword !== password) {
    return Response.json({ error: "Missing or incorrect ?password= — pass the same value as ADMIN_SEED_PASSWORD." }, { status: 403 });
  }

  await dbConnect();
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    existing.passwordHash = passwordHash;
    await existing.save();
    return Response.json({ result: `Updated existing user ${email} to admin role. You can now log in at /admin/login.` });
  }

  await User.create({
    uid: String(Math.floor(100000 + Math.random() * 900000)),
    email,
    passwordHash,
    inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
    role: "admin",
    balance: 0,
  });
  return Response.json({ result: `Created admin user ${email}. You can now log in at /admin/login.` });
}
