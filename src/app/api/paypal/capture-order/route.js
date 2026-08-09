import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import Transaction from "../../../../lib/models/Transaction";
import { getCurrentUser } from "../../../../lib/auth";
import { captureOrder, PayPalError } from "../../../../lib/paypal";
import { creditVerifiedPayment } from "../../../../lib/payments";
import { logActivity } from "../../../../lib/activity";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const orderId = body?.orderId;
  if (!orderId || typeof orderId !== "string") {
    return Response.json({ error: "orderId is required." }, { status: 400 });
  }

  await dbConnect();

  const payment = await Payment.findOne({ provider: "paypal", providerOrderId: orderId });
  if (!payment) {
    return Response.json({ error: "Payment not found." }, { status: 404 });
  }

  if (String(payment.userId) !== String(user._id)) {
    await logActivity({
      user: user._id,
      actorRole: "user",
      action: "paypal_capture_ownership_mismatch",
      message: `User attempted to capture a PayPal order they don't own (order ${orderId}).`,
      meta: { orderId, paymentOwnerId: payment.userId },
    });
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  // Clean success path for refreshes / double-clicks — no re-credit.
  if (payment.status === "COMPLETED") {
    const transaction = await Transaction.findOne({ "meta.paymentId": payment._id });
    return Response.json({ balance: user.balance, transaction });
  }

  if (["FAILED", "CANCELLED", "REFUNDED"].includes(payment.status)) {
    return Response.json({ error: "This payment can no longer be captured." }, { status: 409 });
  }

  let capture;
  try {
    capture = await captureOrder(orderId, String(payment._id));
  } catch (err) {
    payment.status = "FAILED";
    await payment.save();
    if (err instanceof PayPalError) {
      console.error("[paypal/capture-order] Capture request failed", err.detail);
      return Response.json(
        { error: "The payment could not be captured. Please try again." },
        { status: err.status && err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    console.error("[paypal/capture-order] Unexpected error", err);
    return Response.json({ error: "The payment could not be captured. Please try again." }, { status: 502 });
  }

  const captureNode = capture?.purchase_units?.[0]?.payments?.captures?.[0];
  const capturedAmount = captureNode?.amount?.value;
  const capturedCurrency = captureNode?.amount?.currency_code;
  const capturedAmountCents = capturedAmount ? Math.round(Number(capturedAmount) * 100) : null;

  const isValid =
    capture?.status === "COMPLETED" &&
    captureNode?.status === "COMPLETED" &&
    capturedAmountCents === payment.amount &&
    capturedCurrency === payment.currency;

  if (!isValid) {
    payment.status = "FAILED";
    payment.rawCaptureResponse = capture;
    await payment.save();
    console.error("[paypal/capture-order] Capture verification mismatch", {
      paymentId: String(payment._id),
      expectedAmountCents: payment.amount,
      expectedCurrency: payment.currency,
      capturedAmountCents,
      capturedCurrency,
      captureStatus: capture?.status,
    });
    return Response.json({ error: "The payment could not be verified." }, { status: 502 });
  }

  const result = await creditVerifiedPayment(payment._id, {
    captureId: captureNode.id,
    rawCaptureResponse: capture,
  });

  return Response.json({ balance: result.balance, transaction: result.transaction });
}
