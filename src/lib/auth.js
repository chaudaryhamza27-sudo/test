import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dbConnect from "./mongodb";
import User from "./models/User";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "session_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: MAX_AGE });
}

export async function setSessionCookie(userId) {
  const token = signToken(userId);
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
  // Banned users stay authenticated and can use the rest of the app — the
  // ban only gates withdrawals (see POST /api/withdraw), enforced there.
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}
