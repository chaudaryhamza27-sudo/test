import dbConnect from "../../../../lib/mongodb";
import { parseKaropayJson, verifyCallbackSign } from "../../../../lib/karopay";
import { applyPayoutResult } from "../../../../lib/payouts";
import { logActivity } from "../../../../lib/activity";

// Karopay's "Notify Order Result" docs require a plain-text "success" once a
// notify is handled — including a duplicate — or it keeps retrying.
function success() {
  return new Response("success", { status: 200, headers: { "Content-Type": "text/plain" } });
}

// Read the raw body so Karopay's int64 `orderId` isn't rounded by JSON.parse —
// the sign is computed over its exact digits. Form-encoded is accepted too.
async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";
  const text = await request.text();
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(text).entries());
  }
  return parseKaropayJson(text);
}

export async function POST(request) {
  let payload;
  try {
    payload = await parsePayload(request);
  } catch {
    console.error("[karopay/payout-webhook] Unparseable notify payload");
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { merchantOrderId } = payload || {};
  if (!merchantOrderId || typeof merchantOrderId !== "string") {
    return Response.json({ error: "Missing merchantOrderId." }, { status: 400 });
  }

  if (!verifyCallbackSign(payload)) {
    console.error("[karopay/payout-webhook] Signature verification failed", { merchantOrderId });
    await dbConnect();
    await logActivity({
      actorRole: "system",
      action: "karopay_payout_webhook_verification_failed",
      message: `Rejected an unverified Karopay payout notify (merchantOrderId ${merchantOrderId}).`,
    });
    return Response.json({ error: "Signature verification failed." }, { status: 401 });
  }

  // payType 110 = collection; those belong to /api/karopay/webhook.
  if (payload.payType != null && String(payload.payType) !== "120") {
    console.error("[karopay/payout-webhook] Non-payout notify received", { merchantOrderId, payType: payload.payType });
    return success();
  }

  console.info("[karopay/payout-webhook] notify", {
    merchantOrderId,
    code: payload.code,
    status: payload.status,
    msg: payload.msg,
    traceId: payload.traceId,
  });

  await dbConnect();
  const { sign: _sign, ...rawCallback } = payload;
  const result = await applyPayoutResult(merchantOrderId, payload, { source: "callback", rawCallback });
  if (!result.found) {
    console.error("[karopay/payout-webhook] notify for unknown merchantOrderId", merchantOrderId);
  }
  return success();
}
