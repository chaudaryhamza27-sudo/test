import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { getCurrentUser } from "../../../../lib/auth";
import { buildPaymentForm, makeOrderId, CashmaalError } from "../../../../lib/cashmaal";
import { isMethodEnabled } from "../../../../lib/supportSettings";
import {
  validateCashmaalAmount,
  countRecentPendingOrders,
  MAX_PENDING_ORDERS_PER_MINUTE,
  CASHMAAL_MIN_DEPOSIT_AMOUNT,
  CASHMAAL_MAX_DEPOSIT_AMOUNT,
} from "../../../../lib/payments";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  if (!(await isMethodEnabled("cashmaal"))) {
    return Response.json({ error: "CashMaal deposits are currently unavailable." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const amountPaisa = validateCashmaalAmount(Number(body?.amount));
  if (amountPaisa === null) {
    return Response.json(
      { error: `Enter a valid amount between Rs${CASHMAAL_MIN_DEPOSIT_AMOUNT} and Rs${CASHMAAL_MAX_DEPOSIT_AMOUNT} (max two decimal places).` },
      { status: 400 }
    );
  }

  await dbConnect();

  const recentPending = await countRecentPendingOrders(user._id);
  if (recentPending >= MAX_PENDING_ORDERS_PER_MINUTE) {
    return Response.json({ error: "Too many payment attempts — please wait a moment and try again." }, { status: 429 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const orderId = makeOrderId();
  const amountDecimal = (amountPaisa / 100).toFixed(2);

  const payment = await Payment.create({
    userId: user._id,
    provider: "cashmaal",
    providerOrderId: orderId,
    amount: amountPaisa,
    currency: "PKR",
    status: "PENDING",
  });

  try {
    // CashMaal has no server-side "initiate" call — the browser itself POSTs
    // straight to their hosted checkout, so we just hand the form fields back.
    const form = buildPaymentForm({
      orderId,
      currency: "PKR",
      amount: amountDecimal,
      successUrl: `${appUrl}/deposit?cashmaal=success&identifier=${orderId}`,
      cancelUrl: `${appUrl}/deposit?cashmaal=cancelled`,
      // CashMaal's client_email is just a receipt address, not used for account
      // matching, so we send a short synthetic address tied to the user's uid
      // rather than their real email.
      clientEmail: `${user.uid || "demo"}@example.com`,
      addiInfo: "Virtual funds top-up",
    });
    return Response.json({ ...form, identifier: orderId });
  } catch (err) {
    payment.status = "FAILED";
    await payment.save();
    if (err instanceof CashmaalError) {
      console.error("[cashmaal/create-order] CashMaal form build failed", err.detail);
      return Response.json(
        { error: "Could not start the CashMaal checkout. Please try again." },
        { status: err.status && err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    console.error("[cashmaal/create-order] Unexpected error", err);
    return Response.json({ error: "Could not start the CashMaal checkout. Please try again." }, { status: 502 });
  }
}
