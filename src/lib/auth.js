import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dbConnect from "./mongodb";
import User from "./models/User";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "session_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SUPERADMIN_COOKIE_NAME = "superadmin_token";
const SUPERADMIN_MAX_AGE = 60 * 30;

export function signToken(userId, sessionId) {
  const payload = sessionId ? { sub: userId, sid: sessionId } : { sub: userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

export async function setSessionCookie(userId, sessionId) {
  const token = signToken(userId, sessionId);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }

  await dbConnect();
  const user = await User.findById(payload.sub);
  if (!user) return null;
  // Admins are limited to their latest login: a token from any earlier login
  // (or one issued before this check existed) is rejected.
  if (user.role === "admin" && (!payload.sid || payload.sid !== user.adminSessionId)) return null;
  // Banned users stay authenticated and can use the rest of the app — the
  // ban only gates withdrawals (see POST /api/withdraw), enforced there.
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user?.role === "admin") return user;
  return getSuperAdminUser();
}

export async function setSuperAdminCookie(admin) {
  const token = jwt.sign(
    { sub: admin._id.toString(), scope: "superadmin", email: process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() },
    JWT_SECRET,
    { expiresIn: SUPERADMIN_MAX_AGE }
  );
  const store = await cookies();
  store.set(SUPERADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SUPERADMIN_MAX_AGE,
  });
}

export async function clearSuperAdminCookie() {
  const store = await cookies();
  store.delete(SUPERADMIN_COOKIE_NAME);
}

async function getSuperAdminUser() {
  const store = await cookies();
  const token = store.get(SUPERADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.scope !== "superadmin" || payload.email !== process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()) return null;
    await dbConnect();
    const admin = await User.findById(payload.sub);
    return admin?.role === "admin" ? admin : null;
  } catch {
    return null;
  }
}

export async function requireSuperAdmin() {
  return getSuperAdminUser();
}

export async function requireAdminAccess(scope = "admin") {
  if (scope === "superadmin") {
    const superAdmin = await getSuperAdminUser();
    return superAdmin ? { admin: superAdmin, isSuperAdmin: true } : null;
  }

  const admin = await getCurrentUser();
  if (admin?.role === "admin") return { admin, isSuperAdmin: false };
  return null;
}
