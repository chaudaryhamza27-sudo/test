import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { setSessionCookie } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activity";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 10 * 60_000;

export async function POST(request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`login:${ip}`, { max: LOGIN_MAX_ATTEMPTS, windowMs: LOGIN_WINDOW_MS });
  if (!allowed) {
    return Response.json({ error: "Too many login attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  const body = await request.json();
  const { phone, email, password } = body || {};

  if ((!phone && !email) || !password) {
    return Response.json({ error: "Phone or email, and password are required." }, { status: 400 });
  }

  await dbConnect();

  const user = await User.findOne(phone ? { phone } : { email });
  if (!user) {
    await logActivity({ actorRole: "system", action: "login_failed", message: `Failed login attempt for ${phone || email}.` });
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await logActivity({ user: user._id, actorRole: "user", action: "login_failed", message: "Failed login attempt (wrong password)." });
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  user.lastLoginAt = new Date();
  await user.save();
  await setSessionCookie(user._id.toString());
  await logActivity({ user: user._id, actorRole: user.role === "admin" ? "admin" : "user", action: "login", message: "Logged in." });

  return Response.json({
    user: { uid: user.uid, name: user.name, phone: user.phone, email: user.email, balance: user.balance, role: user.role },
  });
}
