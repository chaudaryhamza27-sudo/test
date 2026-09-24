import "server-only";
import crypto from "crypto";

const REQUEST_TIMEOUT_MS = 10000;
const API_BASE = (process.env.KAROPAY_API_BASE || "https://api-pk.karo-pay.com").replace(/\/$/, "");
const COLLECTION_PATH = "/open-api/pay/payment";
const QUERY_PATH = "/open-api/pay/query";

export class KaropayError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = "KaropayError";
    this.status = status;
    this.detail = detail; // server-side only — never send this to the client
  }
}

function assertConfigured() {
  const appId = process.env.KAROPAY_APP_ID;
  const signKey = process.env.KAROPAY_SIGN_KEY;
  if (!appId || !signKey) {
    console.error("[karopay] Missing credentials — set KAROPAY_APP_ID and KAROPAY_SIGN_KEY in .env.local.");
    throw new KaropayError("Payments are temporarily unavailable.", { status: 503 });
  }
  return { appId, signKey };
}

function md5(input) {
  return crypto.createHash("md5").update(input, "utf8").digest("hex");
}

// Karopay's UtcTime header format: "yyyyMMddHHmmss", UTC.
function utcTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    String(d.getUTCFullYear()) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

// Request signing per Karopay's "How to Authenticate Request" doc:
//   Authorization = md5(`${appId}:${md5(signKey)}:${utcTime}`)
// Headers are only valid for 3 minutes from generation, so these are built
// fresh immediately before each request rather than cached.
function buildAuthHeaders() {
  const { appId, signKey } = assertConfigured();
  const utcTime = utcTimestamp();
  const authorization = md5(`${appId}:${md5(signKey)}:${utcTime}`);
  return {
    AppId: appId,
    UtcTime: utcTime,
    Authorization: authorization,
    "Content-Type": "application/json",
  };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new KaropayError("Karopay request timed out.", { status: 504, detail: err });
    }
    throw new KaropayError("Could not reach Karopay.", { status: 502, detail: err });
  } finally {
    clearTimeout(timer);
  }
}

async function parseJsonResponse(res, label) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`[karopay] Non-JSON response from ${label}`, res.status, text.slice(0, 500));
    throw new KaropayError("Karopay returned an unexpected response.", { status: 502, detail: text });
  }
  return data;
}

// "Collection Request" — unlike the previous gateway (a browser-submitted
// hosted-checkout form with no server-side initiate call), Karopay's
// collection endpoint is a real server-to-server POST that returns a payUrl
// for us to redirect the browser to.
export async function createCollectionOrder({
  merchantOrderId,
  merchantUserId,
  merchantUserIp,
  amount, // string, minor units (paisa/cents)
  returnUrl,
  notifyUrl,
  customerName,
  customerCert,
  customerEmail,
  customerPhone,
  defaultChannelName = "easypaisa",
}) {
  const headers = buildAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE}${COLLECTION_PATH}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      merchantOrderId,
      merchantUserId,
      merchantUserIp,
      amount,
      returnUrl,
      notifyUrl,
      customerName,
      customerCert,
      customerEmail,
      customerPhone,
      defaultChannelName,
      showCustomerInfoFlag: true,
      automaticSubmission: false,
      checkoutType: "url",
    }),
  });
  const data = await parseJsonResponse(res, "collection request");
  if (!res.ok || (data?.code && Number(data.code) !== 200)) {
    console.error("[karopay] collection request failed", res.status, data);
    throw new KaropayError(data?.msg || "Karopay could not start this checkout.", {
      status: res.status >= 400 && res.status < 600 ? res.status : 502,
      detail: data,
    });
  }
  return data;
}

// "Order Inquiry Request" — re-fetches an order's current status by our
// merchantOrderId. Used for admin manual reconciliation and client polling
// after the browser returns from Karopay's hosted checkout.
export async function queryOrder(merchantOrderId) {
  const headers = buildAuthHeaders();
  const url = `${API_BASE}${QUERY_PATH}?merchantOrderId=${encodeURIComponent(merchantOrderId)}`;
  const res = await fetchWithTimeout(url, { method: "GET", headers });
  const data = await parseJsonResponse(res, "order inquiry");
  if (!res.ok) {
    console.error("[karopay] order inquiry failed", res.status, data);
    throw new KaropayError(data?.msg || "Karopay could not look up this order.", { status: res.status, detail: data });
  }
  return data;
}

// Generates our own merchant order id (Karopay echoes it back unchanged in
// the notify callback and in the order-inquiry response). Max isn't
// documented; 20 hex chars matches the identifier length the previous
// gateway used.
export function makeOrderId() {
  return crypto.randomBytes(10).toString("hex");
}

// Karopay's Collection Request requires a 13-digit `customerCert` (CNIC),
// but this app doesn't collect real identity documents from users — deposits
// are virtual/demo funds (see src/lib/payments.js). We synthesize a
// same-length numeric placeholder deterministically from the user id, so a
// given user always sends the same synthetic cert across orders rather than
// a fresh random one each time.
export function makeSyntheticCert(userId) {
  const hash = crypto.createHash("sha256").update(String(userId)).digest("hex");
  let digits = "";
  for (const ch of hash) {
    if (digits.length >= 13) break;
    digits += String(parseInt(ch, 16) % 10);
  }
  return digits.padEnd(13, "0").slice(0, 13);
}

// Verifies the `sign` field on an inbound notify callback per Karopay's
// callback-signature procedure: sort all fields except `sign` alphabetically
// by key, join as "k1=v1&k2=v2&...&", append "key=<md5(signKey)>", then md5
// the whole string and compare against the callback's `sign`.
export function verifyCallbackSign(payload) {
  const { signKey } = assertConfigured();
  const { sign, ...rest } = payload || {};
  if (!sign || typeof sign !== "string") return false;

  const sortedKeys = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null && rest[k] !== "")
    .sort();
  const joined = sortedKeys.map((k) => `${k}=${rest[k]}&`).join("");
  const expected = md5(`${joined}key=${md5(signKey)}`);

  const a = Buffer.from(expected);
  const b = Buffer.from(sign);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
