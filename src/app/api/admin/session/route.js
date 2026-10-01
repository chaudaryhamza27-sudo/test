import { requireAdmin } from "../../../../lib/auth";

// Lightweight check the admin dashboard polls so a device whose session was
// replaced by a newer admin login gets sent back to the login page.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true });
}
