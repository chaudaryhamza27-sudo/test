import dbConnect from "../../../../../../lib/mongodb";
import Payment from "../../../../../../lib/models/Payment";
import { requireAdmin } from "../../../../../../lib/auth";
import { getOrder, PayPalError } from "../../../../../../lib/paypal";
import { creditVerifiedPayment } from "../../../../../../lib/payments";
import { logActivity } from "../../../../../../lib/activity";

// Re-fetches the order from PayPal and reconciles our local record against it.
// This is the ONLY path by which an admin can move a payment toward COMPLETED —
// it always goes through creditVerifiedPayment(), which only credits when PayPal
// itself reports a completed capture. There is no direct "mark as completed" action.
export async function POST(request, ctx) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;

  await dbConnect();

  const payment = await Payment.findById(id);
  if (!payment) return Response.json({ error: "Payment not found." }, { status: 404 });

  if (payment.provider === "paybost") {
    // Paybost's published API has no "get payment status" endpoint — only an
    // Initiate Payment call and an inbound IPN webhook. There is nothing to
    // re-fetch here, so an admin cannot force-reconcile a Paybost payment; it
    // can only ever move to COMPLETED via a verified, signature-checked IPN.
    return Response.json(
      {
        error:
          "Paybost has no status API to re-verify against. This payment will only complete when Paybost's IPN webhook arrives — it cannot be reconciled manually.",
      },
      { status: 501 }
    );
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
