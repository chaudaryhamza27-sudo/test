import dbConnect from "../../../../../../lib/mongodb";
import Payment from "../../../../../../lib/models/Payment";
import { requireAdmin } from "../../../../../../lib/auth";
import { getOrder, PayPalError } from "../../../../../../lib/paypal";
import { verifyTransaction, CashmaalError } from "../../../../../../lib/cashmaal";
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

  if (payment.provider === "cashmaal") {
    return verifyCashmaalPayment(admin, payment);
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

// CashMaal's IPN is the primary confirmation path, but their verify_v2 API
// lets an admin re-fetch a transaction by CM_TID. We only ever learn a CM_TID
// from an IPN delivery (successful or otherwise), so until one has arrived
// there's nothing here to re-fetch — the payment can only complete via IPN.
async function verifyCashmaalPayment(admin, payment) {
  if (!payment.providerCaptureId) {
    return Response.json(
      {
        error:
          "CashMaal hasn't reported a transaction ID for this order yet — nothing to re-verify. This payment will only move forward once CashMaal's IPN webhook arrives.",
      },
      { status: 501 }
    );
  }

  let result;
  try {
    result = await verifyTransaction(payment.providerCaptureId);
  } catch (err) {
    if (err instanceof CashmaalError) {
      console.error("[admin/payments/verify] verifyTransaction failed", err.detail);
    } else {
      console.error("[admin/payments/verify] Unexpected error", err);
    }
    return Response.json({ error: "Could not reach CashMaal to re-verify this payment." }, { status: 502 });
  }

  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: "payment_reverified",
    targetUser: payment.userId,
    message: `Re-verified CashMaal transaction ${payment.providerCaptureId} against CashMaal (reported status: ${result.status}).`,
    meta: { paymentId: payment._id, cashmaalStatus: result.status },
  });

  // status: 1 (Successful) | 2 (Pending) | 3 (Rejected) | 0 (Cancelled)
  if (String(result.status) === "1") {
    const reportedAmountCents = Math.round(Number(result.PKR_amount) * 100);
    const amountMatches = reportedAmountCents === payment.amount && payment.currency === "PKR";

    if (!amountMatches) {
      payment.status = "FAILED";
      payment.rawCaptureResponse = result;
      await payment.save();
      return Response.json({ payment, reconciled: false, mismatch: true });
    }

    const credited = await creditVerifiedPayment(payment._id, { captureId: payment.providerCaptureId, rawCaptureResponse: result });
    return Response.json({ payment: credited.payment, reconciled: !credited.alreadyCredited, alreadyCompleted: credited.alreadyCredited });
  }

  if (payment.status !== "COMPLETED") {
    const statusMap = { "3": "FAILED", "2": "PENDING", "0": "CANCELLED" };
    const mapped = statusMap[String(result.status)];
    if (mapped) {
      payment.status = mapped;
      payment.rawCaptureResponse = result;
      await payment.save();
    }
  }

  return Response.json({ payment, reconciled: false });
}
