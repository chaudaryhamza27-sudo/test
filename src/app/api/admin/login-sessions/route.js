import dbConnect from "../../../../lib/mongodb";
import { requireAdmin } from "../../../../lib/auth";
import AdminLoginSession from "../../../../lib/models/AdminLoginSession";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // matches the session cookie

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  await dbConnect();
  const rows = await AdminLoginSession.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("user", "email uid")
    .lean();

  const now = Date.now();
  const sessions = rows.map((s) => {
    let status = "active";
    if (s.endReason === "replaced") status = "replaced";
    else if (s.endReason === "logout") status = "logout";
    else if (now - new Date(s.createdAt).getTime() > SESSION_MAX_AGE_MS) status = "expired";
    return {
      _id: s._id,
      admin: s.user?.email || s.user?.uid || "—",
      device: s.device,
      browser: s.browser,
      os: s.os,
      ip: s.ip,
      location: s.location?.lat != null ? s.location : null,
      loginAt: s.createdAt,
      endedAt: s.endedAt,
      status,
      isCurrent: s.sessionId === admin.adminSessionId,
    };
  });

  return Response.json({ sessions });
}
