import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { verifyIpnKey } from "../../../../lib/cashmaal";
import { creditVerifiedPayment } from "../../../../lib/payments";
import { logActivity } from "../../../../lib/activity";

// CashMaal's IPN docs show a plain (non-bracketed) POST body — status, web_id,
// CM_TID, Amount, currency, fee, client_email, order_id, date_time, addi_info,
// ipn_key — but the exact content-type isn't documented, so accept both a
// form-encoded body and JSON.
async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await request.json().catch(() => ({}));
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export async function POST(request) {
  let payload;
  try {
    payload = await parsePayload(request);
  } catch (err) {
    console.error("[cashmaal/webhook] Failed to parse IPN payload", err);
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { status, order_id: orderId, CM_TID: cmTid, Amount: rawAmount, currency, ipn_key: ipnKey } = payload;

  await dbConnect();

  if (!orderId || typeof orderId !== "string") {
    console.error("[cashmaal/webhook] Missing order_id in IPN payload", payload);
    return Response.json({ ok: true, handled: false });
  }

  if (!verifyIpnKey(ipnKey)) {
    console.error("[cashmaal/webhook] IPN key verification failed", { orderId });
    await logActivity({
      actorRole: "system",
      action: "cashmaal_webhook_verification_failed",
      message: `Rejected an unverified CashMaal IPN (order_id ${orderId}).`,
    });
    return Response.json({ error: "IPN key verification failed." }, { status: 401 });
  }

  const payment = await Payment.findOne({ provider: "cashmaal", providerOrderId: orderId });
  if (!payment) {
    console.error("[cashmaal/webhook] IPN for unknown order_id", orderId);
    return Response.json({ ok: true, handled: false });
  }

  // status: 1 (Successful) | 2 (Pending) | 3 (Rejected) | 0 (Cancelled)
  if (String(status) !== "1") {
    return Response.json({ ok: true, handled: true });
  }

  const reportedAmountCents = rawAmount != null ? Math.round(Number(rawAmount) * 100) : null;
  const amountMatches = reportedAmountCents === payment.amount;
  const currencyMatches = !currency || currency === payment.currency;

  if (!amountMatches || !currencyMatches) {
    console.error("[cashmaal/webhook] Amount/currency mismatch", {
      paymentId: String(payment._id),
      expectedAmountCents: payment.amount,
      expectedCurrency: payment.currency,
      reportedAmountCents,
      reportedCurrency: currency,
    });
    return Response.json({ ok: true, handled: false, mismatch: true });
  }

  try {
    await creditVerifiedPayment(payment._id, {
      captureId: cmTid || null,
      rawCaptureResponse: payload,
    });
  } catch (err) {
    console.error("[cashmaal/webhook] Failed to credit payment", err);
    // Still respond **OK** below — logged above; a retry from CashMaal won't
    // fix an internal error either.
  }

  // CashMaal's docs require the literal body '**OK**' (not JSON) to stop
  // resending this callback — see their sample: exit('**OK**');
  return new Response("**OK**", { status: 200, headers: { "Content-Type": "text/plain" } });
}
