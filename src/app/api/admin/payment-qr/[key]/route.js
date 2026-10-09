import { requireAdmin } from "../../../../../lib/auth";
import { logActivity } from "../../../../../lib/activity";
import { QR_METHOD_KEYS, MAX_QR_BYTES, detectImageExt, saveQr, deleteQr, getQrUrls } from "../../../../../lib/paymentQr";

const LABELS = { easypaisa: "EasyPaisa", jazzcash: "JazzCash" };

// Upload (multipart field "file") or replace the scan-to-pay QR for a manual
// deposit method. Sent as raw multipart, not base64 JSON.
export async function POST(request, ctx) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { key } = await ctx.params;
  if (!QR_METHOD_KEYS.includes(key)) return Response.json({ error: "Unknown payment method." }, { status: 400 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  if (file.size > MAX_QR_BYTES) return Response.json({ error: "QR code must be under 2MB." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExt(buf);
  if (!ext) return Response.json({ error: "QR code must be a PNG, JPG or WEBP image." }, { status: 400 });

  await saveQr(key, buf, ext);
  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: "payment_qr_uploaded",
    message: `Uploaded the ${LABELS[key]} deposit QR code.`,
  });

  return Response.json({ qr: await getQrUrls() });
}

export async function DELETE(request, ctx) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { key } = await ctx.params;
  if (!QR_METHOD_KEYS.includes(key)) return Response.json({ error: "Unknown payment method." }, { status: 400 });

  await deleteQr(key);
  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: "payment_qr_deleted",
    message: `Deleted the ${LABELS[key]} deposit QR code.`,
  });

  return Response.json({ qr: await getQrUrls() });
}
