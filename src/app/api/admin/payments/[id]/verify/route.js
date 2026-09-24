import dbConnect from "../../../../../../lib/mongodb";
import Payment from "../../../../../../lib/models/Payment";
import { requireAdmin } from "../../../../../../lib/auth";
import { getOrder, PayPalError } from "../../../../../../lib/paypal";
import { queryOrder, KaropayError } from "../../../../../../lib/karopay";
import { creditVerifiedPayment } from "../../../../../../lib/payments";
import { logActivity } from "../../../../../../lib/activity";

// Re-fetches the order/transaction from the provider and reconciles our local
// record against it. This is the ONLY path by which an admin can move a
// payment toward COMPLETED — it always goes through creditVerifiedPayment(),
// which only credits when the provider itself reports a completed payment.
// There is no direct "mark as completed" action.
export async function POST(request, ctx) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;

  await dbConnect();

  const payment = await Payment.findById(id);
  if (!payment) return Response.json({ error: "Payment not found." }, { status: 404 });

  if (payment.provider === "karopay") {
    return verifyKaropayPayment(admin, payment);
  }

  let order;
  try {
    order = await getOrder(payment.providerOrderId);
  } catch (err) {
    if (err instanceof PayPalError) {
      console.error("[admin/payments/verify] getOrder failed", err.detail);
    } else {
      console.error("[admin/payments/verify] Unexpected error", err);
    }
    return Response.json({ error: "Could not reach PayPal to re-verify this payment." }, { status: 502 });
  }

  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: "payment_reverified",
    targetUser: payment.userId,
    message: `Re-verified PayPal order ${payment.providerOrderId} against PayPal (reported status: ${order.status}).`,
    meta: { paymentId: payment._id, paypalOrderStatus: order.status },
  });

  const captureNode = order?.purchase_units?.[0]?.payments?.captures?.[0];

  if (captureNode?.status === "COMPLETED") {
    const capturedAmountCents = Math.round(Number(captureNode.amount.value) * 100);
    const amountMatches = capturedAmountCents === payment.amount && captureNode.amount.currency_code === payment.currency;

    if (!amountMatches) {
      payment.status = "FAILED";
      payment.rawCaptureResponse = order;
      await payment.save();
      return Response.json({ payment, reconciled: false, mismatch: true });
    }

    const result = await creditVerifiedPayment(payment._id, { captureId: captureNode.id, rawCaptureResponse: order });
    return Response.json({ payment: result.payment, reconciled: !result.alreadyCredited, alreadyCompleted: result.alreadyCredited });
  }

  // PayPal doesn't show a completed capture — reflect PayPal's actual state rather
  // than guessing. Never set COMPLETED here.
  if (payment.status !== "COMPLETED") {
    const statusMap = { VOIDED: "FAILED", CREATED: "PENDING", SAVED: "PENDING", APPROVED: "APPROVED" };
    const mapped = statusMap[order.status];
    if (mapped) {
      payment.status = mapped;
      payment.rawCaptureResponse = order;
      await payment.save();
    }
  }

  return Response.json({ payment, reconciled: false });
}

// Karopay's notify webhook is the primary confirmation path, but their order
// inquiry API lets an admin re-fetch an order's current status directly by
// our merchantOrderId at any time (unlike the previous gateway, which could
// only be re-checked once an IPN had reported a transaction id).
async function verifyKaropayPayment(admin, payment) {
  let result;
  try {
    result = await queryOrder(payment.providerOrderId);
  } catch (err) {
    if (err instanceof KaropayError) {
      console.error("[admin/payments/verify] queryOrder failed", err.detail);
    } else {
      console.error("[admin/payments/verify] Unexpected error", err);
    }
    return Response.json({ error: "Could not reach Karopay to re-verify this payment." }, { status: 502 });
  }

  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: "payment_reverified",
    targetUser: payment.userId,
    message: `Re-verified Karopay order ${payment.providerOrderId} against Karopay (reported status: ${result.status}).`,
    meta: { paymentId: payment._id, karopayStatus: result.status },
  });

  // status: waiting for submit:99, paying:00, success:01, failed:02, wait confirm:06
  if (String(result.status) === "01") {
    const reportedAmountCents = Math.round(Number(result.amount));
    const amountMatches = reportedAmountCents === payment.amount && payment.currency === "PKR";

    if (!amountMatches) {
      payment.status = "FAILED";
      payment.rawCaptureResponse = result;
      await payment.save();
      return Response.json({ payment, reconciled: false, mismatch: true });
    }

    const credited = await creditVerifiedPayment(payment._id, {
      captureId: result.orderId ? String(result.orderId) : payment.providerCaptureId,
      rawCaptureResponse: result,
    });
    return Response.json({ payment: credited.payment, reconciled: !credited.alreadyCredited, alreadyCompleted: credited.alreadyCredited });
  }

  if (payment.status !== "COMPLETED") {
    const statusMap = { "02": "FAILED", "00": "PENDING", "99": "PENDING", "06": "PENDING" };
    const mapped = statusMap[String(result.status)];
    if (mapped) {
      payment.status = mapped;
      payment.rawCaptureResponse = result;
      await payment.save();
    }
  }

  return Response.json({ payment, reconciled: false });
}
