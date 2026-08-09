import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import { verifyIpnSignature } from "../../../../lib/paybost";
import { creditVerifiedPayment } from "../../../../lib/payments";
import { logActivity } from "../../../../lib/activity";

// Paybost's IPN docs describe a POST with $_POST fields status/identifier/signature/data,
// where `data` is itself an array (amount, currency, charges, transaction id). That shape
// implies a form-encoded body with PHP bracket-notation keys like `data[amount]` rather
// than a JSON body — so we parse as form data and reconstruct any bracketed fields. We
// also fall back to a plain JSON `data` field / JSON body in case their real payload
// differs from the docs, since this endpoint hasn't been exercised against a live IPN yet.
function parseBracketFields(formEntries) {
  const flat = {};
  const data = {};
  for (const [key, value] of formEntries) {
    const match = key.match(/^data\[(.+)\]$/);
    if (match) {
      data[match[1]] = value;
    } else {
      flat[key] = value;
    }
  }
  if (Object.keys(data).length) flat.data = data;
  return flat;
}

async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    if (typeof body.data === "string") {
      try {
        body.data = JSON.parse(body.data);
      } catch {
        // leave as-is
      }
    }
    return body;
  }

  const form = await request.formData();
  const parsed = parseBracketFields(form.entries());
  if (typeof parsed.data === "string") {
    try {
      parsed.data = JSON.parse(parsed.data);
    } catch {
      // leave as-is — no bracketed fields and not JSON, nothing more we can do
    }
  }
  return parsed;
}

export async function POST(request) {
  let payload;
  try {
    payload = await parsePayload(request);
  } catch (err) {
    console.error("[paybost/webhook] Failed to parse IPN payload", err);
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { status, identifier, signature } = payload;
  const data = payload.data || {};

  await dbConnect();

  if (!identifier || typeof identifier !== "string") {
    console.error("[paybost/webhook] Missing identifier in IPN payload", payload);
    return Response.json({ ok: true, handled: false });
  }

  const rawAmount = data.amount;
  const verified = verifyIpnSignature({ rawAmount, identifier, signature });
  if (!verified) {
    console.error("[paybost/webhook] Signature verification failed", { identifier });
    await logActivity({
      actorRole: "system",
      action: "paybost_webhook_verification_failed",
      message: `Rejected an unverified Paybost IPN (identifier ${identifier}).`,
    });
    return Response.json({ error: "Signature verification failed." }, { status: 401 });
  }

  const payment = await Payment.findOne({ provider: "paybost", providerOrderId: identifier });
  if (!payment) {
    console.error("[paybost/webhook] IPN for unknown identifier", identifier);
    return Response.json({ ok: true, handled: false });
  }

  if (status !== "success") {
    // Not a success notification (e.g. failed/cancelled) — nothing to credit.
    return Response.json({ ok: true, handled: true });
  }

  const reportedAmountCents = rawAmount != null ? Math.round(Number(rawAmount) * 100) : null;
  const amountMatches = reportedAmountCents === payment.amount;
  const currencyMatches = !data.currency || data.currency === payment.currency;

  if (!amountMatches || !currencyMatches) {
    console.error("[paybost/webhook] Amount/currency mismatch", {
      paymentId: String(payment._id),
      expectedAmountCents: payment.amount,
      expectedCurrency: payment.currency,
      reportedAmountCents,
      reportedCurrency: data.currency,
    });
    return Response.json({ ok: true, handled: false, mismatch: true });
  }

  try {
    await creditVerifiedPayment(payment._id, {
      captureId: data.transaction_id || data.transactionId || null,
      rawCaptureResponse: payload,
    });
  } catch (err) {
    console.error("[paybost/webhook] Failed to credit payment", err);
    // Still 200 — logged above; a retry from Paybost won't fix an internal error either.
  }

  return Response.json({ ok: true, handled: true });
}
