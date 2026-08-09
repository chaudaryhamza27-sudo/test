import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { verifyWebhookSignature } from "../../../../lib/paypal";
import { creditVerifiedPayment } from "../../../../lib/payments";
import { logActivity } from "../../../../lib/activity";

const HANDLED_EVENTS = ["CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED"];

export async function POST(request) {
  const rawText = await request.text();
  let event;
  try {
    event = JSON.parse(rawText);
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const verified = await verifyWebhookSignature(request.headers, event);
  if (!verified) {
    console.error("[paypal/webhook] Signature verification failed for event", event?.id, event?.event_type);
    await logActivity({
      actorRole: "system",
      action: "paypal_webhook_verification_failed",
      message: `Rejected an unverified PayPal webhook event (${event?.event_type || "unknown"}).`,
    });
    return Response.json({ error: "Signature verification failed." }, { status: 401 });
  }

  await dbConnect();

  if (!HANDLED_EVENTS.includes(event.event_type)) {
    // Acknowledge everything we don't care about so PayPal stops retrying it.
    return Response.json({ ok: true, handled: false });
  }

  try {
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource;
      const orderId = capture?.supplementary_data?.related_ids?.order_id;
      const payment = orderId
        ? await Payment.findOne({ provider: "paypal", providerOrderId: orderId })
        : null;

      if (payment) {
        await creditVerifiedPayment(payment._id, { captureId: capture.id, rawCaptureResponse: capture });
      } else {
        console.error("[paypal/webhook] PAYMENT.CAPTURE.COMPLETED for unknown order", orderId);
      }
    }
    // CHECKOUT.ORDER.APPROVED doesn't carry a capture id yet — it just confirms the
    // buyer approved. The actual credit only ever happens from a verified capture
    // (either the capture-order endpoint or PAYMENT.CAPTURE.COMPLETED above), so
    // there is nothing to do here beyond acknowledging receipt.
  } catch (err) {
    console.error("[paypal/webhook] Failed to process event", event?.event_type, err);
    // Still return 200 — we've logged it, and returning an error would cause PayPal
    // to hammer this endpoint with retries for an error that a retry won't fix.
  }

  return Response.json({ ok: true, handled: true });
}
