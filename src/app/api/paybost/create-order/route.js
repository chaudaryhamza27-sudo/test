import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { getCurrentUser } from "../../../../lib/auth";
import { initiatePayment, makeIdentifier, PaybostError } from "../../../../lib/paybost";
import { isMethodEnabled } from "../../../../lib/supportSettings";
import {
  validatePaybostAmount,
  countRecentPendingOrders,
  MAX_PENDING_ORDERS_PER_MINUTE,
  PAYBOST_MIN_DEPOSIT_AMOUNT,
  PAYBOST_MAX_DEPOSIT_AMOUNT,
} from "../../../../lib/payments";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  if (!(await isMethodEnabled("paybost"))) {
    return Response.json({ error: "Paybost deposits are currently unavailable." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const amountPaisa = validatePaybostAmount(Number(body?.amount));
  if (amountPaisa === null) {
    return Response.json(
      { error: `Enter a valid amount between Rs${PAYBOST_MIN_DEPOSIT_AMOUNT} and Rs${PAYBOST_MAX_DEPOSIT_AMOUNT} (max two decimal places).` },
      { status: 400 }
    );
  }

  await dbConnect();

  const recentPending = await countRecentPendingOrders(user._id);
  if (recentPending >= MAX_PENDING_ORDERS_PER_MINUTE) {
    return Response.json({ error: "Too many payment attempts — please wait a moment and try again." }, { status: 429 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const identifier = makeIdentifier();
  const amountDecimal = (amountPaisa / 100).toFixed(2);

  const payment = await Payment.create({
    userId: user._id,
    provider: "paybost",
    providerOrderId: identifier,
    amount: amountPaisa,
    currency: "PKR",
    status: "PENDING",
  });

  try {
    const result = await initiatePayment({
      identifier,
      currency: "PKR",
      amount: amountDecimal,
      details: "Demo credit top-up",
      ipnUrl: `${appUrl}/api/paybost/webhook`,
      successUrl: `${appUrl}/deposit?paybost=success&identifier=${identifier}`,
      cancelUrl: `${appUrl}/deposit?paybost=cancelled`,
      siteLogo: `${appUrl}/favicon.ico`,
      // Paybost's customer_email field rejects anything over 30 chars (confirmed by
      // testing — real account emails routinely exceed that), so we send a short
      // synthetic address tied to the user's uid rather than their real email.
      customerName: (user.name || user.uid || "Demo User").slice(0, 40),
      customerEmail: `${user.uid || "demo"}@example.com`,
    });
    return Response.json({ url: result.url, identifier });
  } catch (err) {
    payment.status = "FAILED";
    await payment.save();
    if (err instanceof PaybostError) {
      console.error("[paybost/create-order] Paybost initiate failed", err.detail);
      return Response.json(
        { error: "Could not start the Paybost checkout. Please try again." },
        { status: err.status && err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    console.error("[paybost/create-order] Unexpected error", err);
    return Response.json({ error: "Could not start the Paybost checkout. Please try again." }, { status: 502 });
  }
}
