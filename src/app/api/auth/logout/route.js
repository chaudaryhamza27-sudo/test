import { clearSessionCookie, getCurrentUser } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activity";

export async function POST() {
  const user = await getCurrentUser();
  await clearSessionCookie();
  if (user) {
    await logActivity({ user: user._id, actorRole: user.role === "admin" ? "admin" : "user", action: "logout", message: "Logged out." });
  }
  return Response.json({ ok: true });
}
