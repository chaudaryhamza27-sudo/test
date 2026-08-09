import "server-only";
import crypto from "crypto";

const REQUEST_TIMEOUT_MS = 10000;

export class PaybostError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = "PaybostError";
    this.status = status;
    this.detail = detail; // server-side only — never send this to the client
  }
}

function getInitiateUrl() {
  const env = (process.env.PAYBOST_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "live" || env === "production"
    ? "https://paybost.com/payment/initiate"
    : "https://paybost.com/sandbox/payment/initiate";
}

function assertConfigured() {
  const publicKey = process.env.PAYBOST_PUBLIC_KEY;
  const secretKey = process.env.PAYBOST_SECRET_KEY;
  if (!publicKey || !secretKey) {
    console.error("[paybost] Missing credentials — set PAYBOST_PUBLIC_KEY and PAYBOST_SECRET_KEY in .env.local.");
    throw new PaybostError("Payments are temporarily unavailable.", { status: 503 });
  }
  return { publicKey, secretKey };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new PaybostError("Paybost request timed out.", { status: 504, detail: err });
    }
    throw new PaybostError("Could not reach Paybost.", { status: 502, detail: err });
  } finally {
    clearTimeout(timer);
  }
}

// identifier: our own short unique id (<=20 chars, see makeIdentifier below).
// amount: decimal string with 2 places, e.g. "100.00". referenceId is not sent —
// Paybost has no separate order-reference field, `identifier` fills that role.
export async function initiatePayment({
  identifier,
  currency,
  amount,
  details,
  ipnUrl,
  cancelUrl,
  successUrl,
  siteLogo,
  customerName,
  customerEmail,
  checkoutTheme = "dark",
}) {
  const { publicKey } = assertConfigured();

  const form = new URLSearchParams({
    public_key: publicKey,
    identifier,
    currency,
    amount,
    details,
    ipn_url: ipnUrl,
    cancel_url: cancelUrl,
    success_url: successUrl,
    site_logo: siteLogo,
    checkout_theme: checkoutTheme,
    customer_name: customerName,
    customer_email: customerEmail,
  });

  const res = await fetchWithTimeout(getInitiateUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("[paybost] Non-JSON response from initiate endpoint", res.status, text.slice(0, 500));
    throw new PaybostError("Paybost returned an unexpected response.", { status: 502, detail: text });
  }

  if (!res.ok || data?.error === "true" || data?.error === true || !data?.url) {
    console.error("[paybost] Initiate payment failed", res.status, data);
    throw new PaybostError(data?.message || "Paybost could not start this payment.", { status: res.ok ? 502 : res.status, detail: data });
  }

  return data; // { success, message, url }
}

// Generates the 20-char identifier Paybost requires (string(20) per docs).
export function makeIdentifier() {
  return crypto.randomBytes(10).toString("hex"); // 20 hex chars
}

// customKey = <raw amount string as received> + identifier (PHP string concatenation,
// no separator) — must match the exact amount string Paybost sent in the IPN body,
// not a value we reformat ourselves.
export function computeIpnSignature(rawAmount, identifier) {
  const { secretKey } = assertConfigured();
  const customKey = `${rawAmount}${identifier}`;
  return crypto.createHmac("sha256", secretKey).update(customKey).digest("hex").toUpperCase();
}

export function verifyIpnSignature({ rawAmount, identifier, signature }) {
  if (!signature || typeof signature !== "string") return false;
  const expected = computeIpnSignature(rawAmount, identifier);
  const a = Buffer.from(expected.toUpperCase());
  const b = Buffer.from(signature.toUpperCase());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
