import "server-only";
import crypto from "crypto";

const REQUEST_TIMEOUT_MS = 10000;
const PAY_URL = "https://cmaal.com/Pay/";
const VERIFY_URL = "https://api.cmaal.com/verify_v2";

export class CashmaalError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = "CashmaalError";
    this.status = status;
    this.detail = detail; // server-side only — never send this to the client
  }
}

function assertConfigured() {
  const webId = process.env.CASHMAAL_WEB_ID;
  const ipnKey = process.env.CASHMAAL_IPN_KEY;
  if (!webId || !ipnKey) {
    console.error("[cashmaal] Missing credentials — set CASHMAAL_WEB_ID and CASHMAAL_IPN_KEY in .env.local.");
    throw new CashmaalError("Payments are temporarily unavailable.", { status: 503 });
  }
  return { webId, ipnKey };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new CashmaalError("CashMaal request timed out.", { status: 504, detail: err });
    }
    throw new CashmaalError("Could not reach CashMaal.", { status: 502, detail: err });
  } finally {
    clearTimeout(timer);
  }
}

// CashMaal's "Receive Money" API (https://cmaal.com/Pay/) is a hosted checkout
// reached by POSTing an HTML form directly from the browser — there's no
// server-side call that returns a checkout URL like PayPal/Paybost. So this
// just builds the action URL + field values; the caller renders and submits
// an actual <form> to navigate the browser there.
export function buildPaymentForm({
  orderId,
  amount,
  currency,
  successUrl,
  cancelUrl,
  clientEmail,
  addiInfo,
  payMethod = "",
}) {
  const { webId } = assertConfigured();
  return {
    action: PAY_URL,
    fields: {
      pay_method: payMethod,
      amount,
      currency,
      succes_url: successUrl,
      cancel_url: cancelUrl,
      client_email: clientEmail,
      web_id: webId,
      order_id: orderId,
      addi_info: addiInfo,
    },
  };
}

// Generates our own order_id (CashMaal echoes it back unchanged in the IPN
// and in verify_v2's response). Max 80 chars per docs — 20 hex chars is
// plenty and matches the identifier length the previous gateway used.
export function makeOrderId() {
  return crypto.randomBytes(10).toString("hex");
}

export function verifyIpnKey(receivedKey) {
  const { ipnKey } = assertConfigured();
  if (!receivedKey || typeof receivedKey !== "string") return false;
  const a = Buffer.from(ipnKey);
  const b = Buffer.from(receivedKey);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// "Received Money Verification Using API" — re-fetches a transaction by
// CashMaal's own CM_TID. Used for admin manual reconciliation; we can only
// call this once a CM_TID is known (i.e. after an IPN has reported one).
export async function verifyTransaction(cmTid) {
  const { webId } = assertConfigured();
  const url = `${VERIFY_URL}?CM_TID=${encodeURIComponent(cmTid)}&web_id=${encodeURIComponent(webId)}`;

  const res = await fetchWithTimeout(url, { method: "GET" });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("[cashmaal] Non-JSON response from verify_v2", res.status, text.slice(0, 500));
    throw new CashmaalError("CashMaal returned an unexpected response.", { status: 502, detail: text });
  }

  if (!res.ok) {
    console.error("[cashmaal] verify_v2 failed", res.status, data);
    throw new CashmaalError(data?.error || "CashMaal could not verify this transaction.", { status: res.status, detail: data });
  }

  return data;
}
