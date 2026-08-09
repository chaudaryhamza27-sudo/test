import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { setSessionCookie } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activity";

export async function POST(request) {
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
  if (user.isBanned) {
    return Response.json({ error: "This account has been banned." }, { status: 403 });
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
