import { randomUUID } from "crypto";
import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { getCurrentUser } from "../../../../lib/auth";
import { createOrder, PayPalError } from "../../../../lib/paypal";
import {
  validateDepositAmount,
  countRecentPendingOrders,
  MAX_PENDING_ORDERS_PER_MINUTE,
} from "../../../../lib/payments";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const amountCents = validateDepositAmount(Number(body?.amount));
  if (amountCents === null) {
    return Response.json({ error: "Enter a valid amount between $1 and $500 (max two decimal places)." }, { status: 400 });
  }

  await dbConnect();

  const recentPending = await countRecentPendingOrders(user._id);
  if (recentPending >= MAX_PENDING_ORDERS_PER_MINUTE) {
    return Response.json({ error: "Too many payment attempts — please wait a moment and try again." }, { status: 429 });
  }

  const payment = await Payment.create({
    userId: user._id,
    provider: "paypal",
    providerOrderId: `pending-${randomUUID()}`, // placeholder until PayPal returns the real id; replaced below
    amount: amountCents,
    currency: "USD",
    status: "PENDING",
  });

  try {
    const order = await createOrder({ amountCents, currency: "USD", referenceId: String(payment._id) });
    payment.providerOrderId = order.id;
    await payment.save();
    return Response.json({ orderId: order.id });
  } catch (err) {
    payment.status = "FAILED";
    await payment.save();
    if (err instanceof PayPalError) {
      console.error("[paypal/create-order] PayPal order creation failed", err.detail);
      return Response.json(
        { error: "Could not start the PayPal checkout. Please try again." },
        { status: err.status && err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    console.error("[paypal/create-order] Unexpected error", err);
    return Response.json({ error: "Could not start the PayPal checkout. Please try again." }, { status: 502 });
  }
}
