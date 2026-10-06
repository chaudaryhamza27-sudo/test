import {
  clearSuperAdminCookie,
  requireSuperAdmin,
  setSuperAdminCookie,
} from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

export async function GET() {
  const admin = await requireSuperAdmin();
  return Response.json({ unlocked: Boolean(admin) }, { status: admin ? 200 : 403 });
}

export async function POST(request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`superadmin-login:${ip}`, { max: 8, windowMs: 10 * 60_000 });
  if (!allowed) return Response.json({ error: "Too many attempts. Please wait and try again." }, { status: 429 });

  const requiredEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const requiredPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!requiredEmail || !requiredPassword) {
    return Response.json({ error: "Configure SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD on the server first." }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    typeof body?.email !== "string" ||
    typeof body?.password !== "string" ||
    body.email.trim().toLowerCase() !== requiredEmail ||
    body.password !== requiredPassword
  ) {
    return Response.json({ error: "Incorrect superadmin email or password." }, { status: 401 });
  }

  await dbConnect();
  const admin = (process.env.ADMIN_SEED_EMAIL
    ? await User.findOne({ email: process.env.ADMIN_SEED_EMAIL.trim().toLowerCase(), role: "admin" })
    : null) || await User.findOne({ role: "admin" }).sort({ createdAt: 1 });
  if (!admin) {
    return Response.json({ error: "No admin audit account exists yet. Create the admin account before signing in." }, { status: 503 });
  }

  await setSuperAdminCookie(admin);
  return Response.json({ unlocked: true });
}

export async function DELETE() {
  await clearSuperAdminCookie();
  return Response.json({ unlocked: false });
}