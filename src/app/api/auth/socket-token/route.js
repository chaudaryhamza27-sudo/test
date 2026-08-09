import jwt from "jsonwebtoken";
import { getCurrentUser } from "../../../../lib/auth";

const JWT_SECRET = process.env.JWT_SECRET;

// Issues a short-lived, purpose-scoped token so the browser can authenticate
// its Socket.IO connection to the separate realtime-server. We can't just
// forward the session cookie itself: it's httpOnly (so client JS can't read
// it) and the realtime server runs on a different port, which makes relying
// on implicit cross-origin cookie delivery fragile. This endpoint reads the
// *existing* httpOnly session server-side and hands back a fresh, 60-second
// token scoped only for socket auth — never the real session token.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const token = jwt.sign({ sub: user._id.toString(), purpose: "socket" }, JWT_SECRET, { expiresIn: 60 });
  return Response.json({ token });
}
