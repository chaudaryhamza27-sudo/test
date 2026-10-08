import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { getCurrentUser } from "../../../../lib/auth";
import {
  createNgPayCollectionOrder,
  formatNgPayAmount,
  getNgPayConfig,
  makeNgPayOrderNo,
  pickNgPayCheckoutUrl,
  NgPayError,
} from "../../../../lib/ngpay";
import { isMethodEnabled } from "../../../../lib/supportSettings";
import {
  validateKaropayAmount,
  countRecentPendingOrders,
  alertKaropayDeposit,
  MAX_PENDING_ORDERS_PER_MINUTE,
  NGPAY_MIN_DEPOSIT_AMOUNT,
  NGPAY_MAX_DEPOSIT_AMOUNT,
} from "../../../../lib/payments";

const IS_DEV = process.env.NODE_ENV !== "production";

// Checkout (hosted cashier) products — the user picks the wallet on our form,
// NG Pay hosts the actual payment page.
const PAY_TYPES = { easypaisa: "EASYPAISA", jazzcash: "JAZZ_CASH" };

function isLocalUrl(url) {
  try {
    const { hostname } = new URL(url);
    return ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(hostname);
  } catch {
    return true;
  }
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  // Off by default — only live once an admin switches NG Pay on under Deposit Funds.
  if (!(await isMethodEnabled("ngpay"))) {
    return Response.json({ error: "NG Pay deposits are currently unavailable." }, { status: 403 });
  }

  try {
    getNgPayConfig();
  } catch (err) {
    console.error("[ngpay/create-order]", err.message);
    return Response.json({ error: "NG Pay deposits are not configured on this server." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const channel = PAY_TYPES[body?.channel] ? body.channel : "easypaisa";
  const amount = Number(body?.amount);
  const amountPaisa = amount <= NGPAY_MAX_DEPOSIT_AMOUNT ? validateKaropayAmount(amount, NGPAY_MIN_DEPOSIT_AMOUNT) : null;
  if (amountPaisa === null) {
    return Response.json(
      { error: `Enter a valid amount between Rs${NGPAY_MIN_DEPOSIT_AMOUNT} and Rs${NGPAY_MAX_DEPOSIT_AMOUNT} (max two decimal places).` },
      { status: 400 }
    );
  }

  await dbConnect();

  const recentPending = await countRecentPendingOrders(user._id);
  if (recentPending >= MAX_PENDING_ORDERS_PER_MINUTE) {
    return Response.json({ error: "Too many payment attempts — please wait a moment and try again." }, { status: 429 });
  }

  const appUrl = (request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  // NG Pay posts the notify callback server-to-server, so production needs a public URL.
  const notifyBase = (process.env.NGPAY_NOTIFY_BASE_URL || appUrl).replace(/\/$/, "");
  if (isLocalUrl(notifyBase) && process.env.NODE_ENV === "production") {
    console.error(
      `[ngpay/create-order] notify URL base "${notifyBase}" is not publicly reachable — set NGPAY_NOTIFY_BASE_URL (or NEXT_PUBLIC_APP_URL) to a public https URL.`
    );
    return Response.json({ error: "NG Pay deposits are not configured on this server." }, { status: 503 });
  }

  const orderNo = makeNgPayOrderNo();
  const payment = await Payment.create({
    userId: user._id,
    provider: "ngpay",
    providerOrderId: orderNo,
    amount: amountPaisa,
    currency: "PKR",
    status: "PENDING",
  });

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  try {
    const result = await createNgPayCollectionOrder({
      merchantOrderNo: orderNo,
      amount: formatNgPayAmount(amountPaisa),
      payType: PAY_TYPES[channel],
      productTitle: "Wallet deposit",
      notifyUrl: `${notifyBase}/api/ngpay/webhook`,
      viewUrl: `${appUrl}/deposit?ngpay=return&identifier=${orderNo}`,
      clientIp,
    });

    const payUrl = pickNgPayCheckoutUrl(result);
    if (!payUrl) {
      throw new NgPayError("NG Pay did not return a checkout URL.", { status: 502, detail: result });
    }

    if (result.orderNo) {
      payment.providerCaptureId = String(result.orderNo);
      await payment.save();
    }

    await alertKaropayDeposit("requested", payment);

    return Response.json({ payUrl, identifier: orderNo });
  } catch (err) {
    // An "uncertain" error (timeout / unreadable reply) may still have created
    // the order at NG Pay — keep it PENDING so the status check can settle it.
    if (!(err instanceof NgPayError && err.uncertain)) {
      payment.status = "FAILED";
      await payment.save();
    }
    console.error("[ngpay/create-order] NG Pay order creation failed", {
      merchantOrderNo: orderNo,
      message: err?.message,
      status: err?.status,
      detail: err?.detail,
    });
    return Response.json(
      {
        error: "Could not start the NG Pay checkout. Please try again.",
        ...(IS_DEV && { debug: { message: err?.message, status: err?.status, detail: err?.detail } }),
      },
      { status: err instanceof NgPayError && err.status >= 400 && err.status < 600 ? err.status : 502 }
    );
  }
}
