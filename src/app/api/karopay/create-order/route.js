import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { getCurrentUser } from "../../../../lib/auth";
import { createCollectionOrder, makeOrderId, makeSyntheticCert, KaropayError } from "../../../../lib/karopay";
import { isMethodEnabled } from "../../../../lib/supportSettings";
import {
  validateKaropayAmount,
  countRecentPendingOrders,
  MAX_PENDING_ORDERS_PER_MINUTE,
  KAROPAY_MIN_DEPOSIT_AMOUNT,
  KAROPAY_MAX_DEPOSIT_AMOUNT,
} from "../../../../lib/payments";

const PHONE_RE = /^3\d{9}$/;

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  if (!(await isMethodEnabled("karopay"))) {
    return Response.json({ error: "Karopay deposits are currently unavailable." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const amountPaisa = validateKaropayAmount(Number(body?.amount));
  if (amountPaisa === null) {
    return Response.json(
      { error: `Enter a valid amount between Rs${KAROPAY_MIN_DEPOSIT_AMOUNT} and Rs${KAROPAY_MAX_DEPOSIT_AMOUNT} (max two decimal places).` },
      { status: 400 }
    );
  }

  const customerPhone = String(body?.customerPhone || "").trim();
  if (!PHONE_RE.test(customerPhone)) {
    return Response.json({ error: "Enter a valid 10-digit mobile number starting with 3." }, { status: 400 });
  }

  await dbConnect();

  const recentPending = await countRecentPendingOrders(user._id);
  if (recentPending >= MAX_PENDING_ORDERS_PER_MINUTE) {
    return Response.json({ error: "Too many payment attempts — please wait a moment and try again." }, { status: 429 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const orderId = makeOrderId();

  const payment = await Payment.create({
    userId: user._id,
    provider: "karopay",
    providerOrderId: orderId,
    amount: amountPaisa,
    currency: "PKR",
    status: "PENDING",
  });

  const forwardedFor = request.headers.get("x-forwarded-for");
  const merchantUserIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  try {
    const result = await createCollectionOrder({
      merchantOrderId: orderId,
      merchantUserId: String(user._id),
      merchantUserIp,
      amount: String(amountPaisa),
      returnUrl: `${appUrl}/deposit?karopay=return&identifier=${orderId}`,
      notifyUrl: `${appUrl}/api/karopay/webhook`,
      // Karopay's client-facing email is just a receipt address, not used for
      // account matching, so send a short synthetic address tied to the
      // user's uid rather than their real email.
      customerEmail: `${user.uid || "demo"}@example.com`,
      customerName: user.name || user.uid || "Customer",
      customerCert: makeSyntheticCert(user._id),
      customerPhone,
      defaultChannelName: "easypaisa",
    });

    if (!result.payUrl) {
      throw new KaropayError("Karopay did not return a checkout URL.", { status: 502, detail: result });
    }

    if (result.orderId) {
      payment.providerCaptureId = String(result.orderId);
      await payment.save();
    }

    return Response.json({ payUrl: result.payUrl, identifier: orderId });
  } catch (err) {
    payment.status = "FAILED";
    await payment.save();
    if (err instanceof KaropayError) {
      console.error("[karopay/create-order] Karopay order creation failed", err.detail);
      return Response.json(
        { error: "Could not start the Karopay checkout. Please try again." },
        { status: err.status && err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    console.error("[karopay/create-order] Unexpected error", err);
    return Response.json({ error: "Could not start the Karopay checkout. Please try again." }, { status: 502 });
  }
}
