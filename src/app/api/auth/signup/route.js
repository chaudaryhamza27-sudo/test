import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { setSessionCookie } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activity";
import { notifyUser } from "../../../../lib/notifications";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

const STARTER_BALANCE = 0;
const SIGNUP_MAX_ATTEMPTS = 5;
const SIGNUP_WINDOW_MS = 60 * 60_000;

function genInviteCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function POST(request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`signup:${ip}`, { max: SIGNUP_MAX_ATTEMPTS, windowMs: SIGNUP_WINDOW_MS });
  if (!allowed) {
    return Response.json({ error: "Too many accounts created from this connection. Please try again later." }, { status: 429 });
  }

  const body = await request.json();
  const { name, phone, email, password, confirmPassword, inviteCode } = body || {};

  if ((!phone && !email) || !password) {
    return Response.json({ error: "Phone or email, and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (typeof confirmPassword === "string" && confirmPassword !== password) {
    return Response.json({ error: "Passwords do not match." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  await dbConnect();

  const existing = await User.findOne(phone ? { phone } : { email });
  if (existing) {
    return Response.json({ error: "An account with this phone/email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  for (let attempt = 0; attempt < 3 && !user; attempt++) {
    try {
      user = await User.create({
        uid: String(Math.floor(100000 + Math.random() * 900000)),
        name: (name || "").trim(),
        phone: phone || null,
        email: email || null,
        passwordHash,
        inviteCode: genInviteCode(),
        referredBy: inviteCode || null,
        // Educational simulation only — this is a demo credit balance, never real money.
        balance: STARTER_BALANCE,
      });
    } catch (err) {
      if (err?.code !== 11000 || attempt === 2) {
        return Response.json({ error: "Could not create account. Please try again." }, { status: 500 });
      }
    }
  }

  await setSessionCookie(user._id.toString());
  await logActivity({
    user: user._id,
    actorRole: "user",
    action: "signup",
    message: "Account created.",
  });
  await notifyUser(user._id, {
    type: "welcome",
    title: "Welcome to Practice Mode",
    message: "Your account starts with a Rs0 balance — make a virtual deposit to get started. No real money is involved.",
  });

  return Response.json({
    user: { uid: user.uid, name: user.name, phone: user.phone, email: user.email, balance: user.balance },
  });
}
