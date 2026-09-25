import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { verifyCallbackSign } from "../../../../lib/karopay";
import { creditVerifiedPayment } from "../../../../lib/payments";
import { logActivity } from "../../../../lib/activity";

// Karopay's notify docs don't pin down the exact content-type, so accept
// both a form-encoded body and JSON.
async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await request.json().catch(() => ({}));
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export async function POST(request) {
  let payload;
  try {
    payload = await parsePayload(request);
  } catch (err) {
    console.error("[karopay/webhook] Failed to parse notify payload", err);
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { status, merchantOrderId, orderId: providerOrderId, amount: rawAmount } = payload;

  await dbConnect();

  if (!merchantOrderId || typeof merchantOrderId !== "string") {
    console.error("[karopay/webhook] Missing merchantOrderId in notify payload", payload);
    return Response.json({ ok: true, handled: false });
  }

  if (!verifyCallbackSign(payload)) {
    console.error("[karopay/webhook] Signature verification failed", { merchantOrderId });
    await logActivity({
      actorRole: "system",
      action: "karopay_webhook_verification_failed",
      message: `Rejected an unverified Karopay notify (merchantOrderId ${merchantOrderId}).`,
    });
    return Response.json({ error: "Signature verification failed." }, { status: 401 });
  }

  const payment = await Payment.findOne({ provider: "karopay", providerOrderId: merchantOrderId });
  if (!payment) {
    console.error("[karopay/webhook] notify for unknown merchantOrderId", merchantOrderId);
    return Response.json({ ok: true, handled: false });
  }

  // status: waiting for submit:99, paying:00, success:01, failed:02, wait confirm:06
  if (String(status) === "02") {
    await Payment.updateOne({ _id: payment._id, status: "PENDING" }, { $set: { status: "FAILED", rawCaptureResponse: payload } });
    return new Response("success", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  if (String(status) !== "01") {
    return Response.json({ ok: true, handled: true });
  }

  const reportedAmountCents = rawAmount != null ? Math.round(Number(rawAmount)) : null;
  const amountMatches = reportedAmountCents === payment.amount;

  if (!amountMatches) {
    console.error("[karopay/webhook] Amount mismatch", {
      paymentId: String(payment._id),
      expectedAmountCents: payment.amount,
      reportedAmountCents,
    });
    return Response.json({ ok: true, handled: false, mismatch: true });
  }

  try {
    await creditVerifiedPayment(payment._id, {
      captureId: providerOrderId ? String(providerOrderId) : payment.providerCaptureId,
      rawCaptureResponse: payload,
    });
  } catch (err) {
    console.error("[karopay/webhook] Failed to credit payment", err);
    // Still respond 200/"success" below — logged above; a retry from Karopay
    // won't fix an internal error either.
  }

  // Karopay's docs require a plain "200 + text/plain 'success'" response to
  // stop this callback from being resent.
  return new Response("success", { status: 200, headers: { "Content-Type": "text/plain" } });
}
