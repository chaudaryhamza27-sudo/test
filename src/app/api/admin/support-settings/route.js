import { requireAdmin } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activity";
import { getOrCreateSupportSettings } from "../../../../lib/supportSettings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const settings = await getOrCreateSupportSettings();
  return Response.json({ settings });
}

// Content/config only — toggles what's displayed to users (support status,
// contact number, which deposit method names are advertised). No payment
// gateway credentials, no API keys, no real payout capability.
export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const settings = await getOrCreateSupportSettings();

  if (typeof body.online === "boolean") {
    settings.online = body.online;
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "support_status_updated",
      message: `Set support status to ${body.online ? "Online" : "Offline"}.`,
    });
  }

  if (typeof body.whatsappNumber === "string") {
    settings.whatsappNumber = body.whatsappNumber.trim().slice(0, 30);
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "support_whatsapp_updated",
      message: `Updated WhatsApp support number.`,
    });
  }

  if (typeof body.announcementText === "string") {
    settings.announcementText = body.announcementText.trim().slice(0, 500);
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "announcement_updated",
      message: `Updated the announcement text.`,
    });
  }

  if (typeof body.announcementEnabled === "boolean") {
    settings.announcementEnabled = body.announcementEnabled;
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "announcement_toggled",
      message: `${body.announcementEnabled ? "Enabled" : "Disabled"} the announcement.`,
    });
  }

  if (body.methodKey && typeof body.methodEnabled === "boolean") {
    const method = settings.methods.find((m) => m.key === body.methodKey);
    if (!method) return Response.json({ error: "Unknown payment method." }, { status: 400 });
    method.enabled = body.methodEnabled;
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "payment_method_toggled",
      message: `${body.methodEnabled ? "Enabled" : "Disabled"} ${method.label} as an advertised deposit method.`,
    });
  }

  if (body.withdrawMethodKey && typeof body.withdrawMethodEnabled === "boolean") {
    const method = settings.withdrawMethods.find((m) => m.key === body.withdrawMethodKey);
    if (!method) return Response.json({ error: "Unknown withdraw method." }, { status: 400 });
    method.enabled = body.withdrawMethodEnabled;
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "withdraw_method_toggled",
      message: `${body.withdrawMethodEnabled ? "Enabled" : "Disabled"} ${method.label} as an advertised withdraw method.`,
    });
  }

  settings.updatedBy = admin._id;
  await settings.save();

  return Response.json({ settings });
}
