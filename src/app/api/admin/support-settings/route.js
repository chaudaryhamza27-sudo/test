import dbConnect from "../../../../lib/mongodb";
import SupportSettings from "../../../../lib/models/SupportSettings";
import { requireAdmin } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activity";

async function getOrCreate() {
  let doc = await SupportSettings.findOne();
  if (!doc) doc = await SupportSettings.create({});
  return doc;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  await dbConnect();
  const settings = await getOrCreate();
  return Response.json({ settings });
}

// Content/config only — toggles what's displayed to users (support status,
// contact number, which deposit method names are advertised). No payment
// gateway credentials, no API keys, no real payout capability.
export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  await dbConnect();
  const settings = await getOrCreate();

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

  settings.updatedBy = admin._id;
  await settings.save();

  return Response.json({ settings });
}
