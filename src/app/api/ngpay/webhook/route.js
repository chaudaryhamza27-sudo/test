import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { verifyNgPayDataSign, mapNgPayStatus, parseNgPayAmount } from "../../../../lib/ngpay";
import { creditVerifiedPayment, alertKaropayDeposit } from "../../../../lib/payments";
import { logActivity } from "../../../../lib/activity";

// Accept JSON (NG Pay's default) or a form-encoded body. Some gateways wrap
// the signed fields in a `data` object — unwrap that too.
async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";
  let payload;
  if (contentType.includes("application/json")) {
    payload = await request.json().catch(() => ({}));
  } else {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries());
  }
  return payload?.data && typeof payload.data === "object" ? payload.data : payload;
}

// NG Pay stops resending the callback once it gets a plain "success".
const ack = () => new Response("success", { status: 200, headers: { "Content-Type": "text/plain" } });

export async function POST(request) {
  let payload;
  try {
    payload = await parsePayload(request);
  } catch (err) {
    console.error("[ngpay/webhook] Failed to parse notify payload", err);
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { merchantOrderNo, orderNo, amount, status } = payload || {};
  if (!merchantOrderNo || typeof merchantOrderNo !== "string") {
    console.error("[ngpay/webhook] Missing merchantOrderNo in notify payload");
    return Response.json({ ok: true, handled: false });
  }

  await dbConnect();

  let verified = false;
  try {
    verified = verifyNgPayDataSign(payload);
  } catch {
    // Non-scalar field in the payload — can't be a validly signed NG Pay notify.
  }
  if (!verified) {
    console.error("[ngpay/webhook] Signature verification failed", { merchantOrderNo });
    await logActivity({
      actorRole: "system",
      action: "ngpay_webhook_verification_failed",
      message: `Rejected an unverified NG Pay notify (merchantOrderNo ${merchantOrderNo}).`,
    });
    return Response.json({ error: "Signature verification failed." }, { status: 401 });
  }

  const payment = await Payment.findOne({ provider: "ngpay", providerOrderId: merchantOrderNo });
  if (!payment) {
    console.error("[ngpay/webhook] notify for unknown merchantOrderNo", merchantOrderNo);
    return Response.json({ ok: true, handled: false });
  }

  const mapped = mapNgPayStatus(status);
  if (mapped === "FAILED") {
    const failed = await Payment.updateOne({ _id: payment._id, status: "PENDING" }, { $set: { status: "FAILED", rawCaptureResponse: payload } });
    if (failed.modifiedCount) await alertKaropayDeposit("failed", payment);
    return ack();
  }
  if (mapped !== "COMPLETED") {
    // Still processing (or a refund notice) — nothing to credit yet.
    return ack();
  }

  const reportedPaisa = parseNgPayAmount(amount);
  if (reportedPaisa !== payment.amount) {
    console.error("[ngpay/webhook] Amount mismatch", {
      paymentId: String(payment._id),
      expectedPaisa: payment.amount,
      reportedPaisa,
    });
    return Response.json({ ok: true, handled: false, mismatch: true });
  }

  try {
    await creditVerifiedPayment(payment._id, {
      captureId: orderNo ? String(orderNo) : payment.providerCaptureId,
      rawCaptureResponse: payload,
    });
  } catch (err) {
    console.error("[ngpay/webhook] Failed to credit payment", err);
  }

  return ack();
}
