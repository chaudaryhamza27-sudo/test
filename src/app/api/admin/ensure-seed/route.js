import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";

// Local-dev convenience, called from /admin on page load: if the database
// has no admin account at all yet, silently create one from
// ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD (this deployment's own env vars,
// never request input) so `npm run create-admin` / /api/admin/seed don't
// have to be run by hand first. Never runs in production, and never touches
// an admin account that already exists — it only fires once, the first time
// the DB has zero admins.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ ok: false });
  }

  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    return Response.json({ ok: false });
  }

  await dbConnect();

  const anyAdmin = await User.findOne({ role: "admin" });
  if (anyAdmin) {
    return Response.json({ ok: false });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    existing.passwordHash = passwordHash;
    await existing.save();
    return Response.json({ ok: true, result: "promoted" });
  }

  await User.create({
    uid: String(Math.floor(100000 + Math.random() * 900000)),
    email,
    passwordHash,
    inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
    role: "admin",
    balance: 0,
  });
  return Response.json({ ok: true, result: "created" });
}
