import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import AdminLoginSession from "../../../../lib/models/AdminLoginSession";
import { setSessionCookie } from "../../../../lib/auth";
import { describeUserAgent } from "../../../../lib/userAgent";
import { logActivity } from "../../../../lib/activity";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 10 * 60_000;

function parseLocation(loc) {
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const accuracy = Number(loc?.accuracy);
  const place = typeof loc?.place === "string" ? loc.place.trim().slice(0, 120) || null : null;
  return { lat, lng, accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null, place };
}

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

  // Admin logins must share the browser's location; without it the login is
  // refused before any session is created.
  const location = parseLocation(body.location);
  if (user.role === "admin" && !location) {
    await logActivity({ user: user._id, actorRole: "admin", action: "login_failed", message: "Admin login refused: location not shared." });
    return Response.json({ error: "Location access is required to sign in as admin. Allow location and try again." }, { status: 403 });
  }

  // A new admin login replaces the stored session id, logging out every other
  // device signed in to this admin account.
  const sessionId = user.role === "admin" ? randomUUID() : undefined;
  if (sessionId) user.adminSessionId = sessionId;
  user.lastLoginAt = new Date();
  await user.save();
  if (sessionId) {
    // Record the device for the admin "Login Information" tab and close out
    // the sessions this login just replaced.
    const now = new Date();
    await AdminLoginSession.updateMany({ user: user._id, endedAt: null }, { endedAt: now, endReason: "replaced" });
    const userAgent = request.headers.get("user-agent") || "";
    await AdminLoginSession.create({ user: user._id, sessionId, ip, userAgent, location, ...describeUserAgent(userAgent) });
  }
  await setSessionCookie(user._id.toString(), sessionId);
  await logActivity({ user: user._id, actorRole: user.role === "admin" ? "admin" : "user", action: "login", message: "Logged in." });

  return Response.json({
    user: { uid: user.uid, name: user.name, phone: user.phone, email: user.email, balance: user.balance, role: user.role },
  });
}
