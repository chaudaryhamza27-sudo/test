import { clearSessionCookie, getCurrentUser } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activity";
import AdminLoginSession from "../../../../lib/models/AdminLoginSession";

export async function POST() {
  const user = await getCurrentUser();
  await clearSessionCookie();
  if (user?.role === "admin") {
    await AdminLoginSession.updateOne({ sessionId: user.adminSessionId, endedAt: null }, { endedAt: new Date(), endReason: "logout" });
    user.adminSessionId = null;
    await user.save();
  }
  if (user) {
    await logActivity({ user: user._id, actorRole: user.role === "admin" ? "admin" : "user", action: "logout", message: "Logged out." });
  }
  return Response.json({ ok: true });
}
