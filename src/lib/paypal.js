import "server-only";

const REQUEST_TIMEOUT_MS = 10000;

export class PayPalError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = "PayPalError";
    this.status = status;
    this.detail = detail; // server-side only — never send this to the client
  }
}

function getBaseUrl() {
  const env = (process.env.PAYPAL_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "live" || env === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function assertConfigured() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error(
      "[paypal] Missing PayPal credentials — set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local."
    );
    throw new PayPalError("Payments are temporarily unavailable.", { status: 503 });
  }
  return { clientId, clientSecret };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new PayPalError("PayPal request timed out.", { status: 504, detail: err });
    }
    throw new PayPalError("Could not reach PayPal.", { status: 502, detail: err });
  } finally {
    clearTimeout(timer);
  }
}

// In-memory OAuth token cache. Fine for a single Node process; if this app is
// ever deployed across multiple serverless instances each will keep its own
// cache, which is harmless (just means a few extra token requests).
let cachedToken = null; // { accessToken, expiresAt }

export async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const { clientId, clientSecret } = assertConfigured();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetchWithTimeout(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[paypal] OAuth token request failed", res.status, body);
    throw new PayPalError("Could not authenticate with PayPal.", { status: 502, detail: body });
  }

  const data = await res.json();
  const marginMs = 60_000;
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Math.max(0, data.expires_in * 1000 - marginMs),
  };
  return cachedToken.accessToken;
}

async function paypalFetch(path, { method = "GET", body, requestId } = {}) {
  const token = await getAccessToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (requestId) headers["PayPal-Request-Id"] = String(requestId);

  const res = await fetchWithTimeout(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    console.error(`[paypal] ${method} ${path} failed`, res.status, text);
    throw new PayPalError("PayPal request failed.", { status: res.status, detail: data });
  }

  return data;
}

// amountCents: integer cents. referenceId: our internal Payment._id as a string.
export async function createOrder({ amountCents, currency = "USD", referenceId }) {
  const value = (amountCents / 100).toFixed(2);
  return paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: referenceId,
          amount: { currency_code: currency, value },
        },
      ],
    },
  });
}

export async function getOrder(orderId) {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}

// requestId should be our internal Payment._id so PayPal deduplicates retried captures.
export async function captureOrder(orderId, requestId) {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    requestId,
  });
}

// headers: the incoming Request's headers (case-insensitive get). body: the parsed webhook event JSON.
export async function verifyWebhookSignature(headers, body) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error("[paypal] PAYPAL_WEBHOOK_ID is not set — cannot verify webhook signatures.");
    return false;
  }

  const get = (name) => headers.get(name) ?? headers.get(name.toLowerCase());

  try {
    const result = await paypalFetch("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: {
        auth_algo: get("paypal-auth-algo"),
        cert_url: get("paypal-cert-url"),
        transmission_id: get("paypal-transmission-id"),
        transmission_sig: get("paypal-transmission-sig"),
        transmission_time: get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: body,
      },
    });
    return result.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[paypal] Webhook signature verification request failed", err);
    return false;
  }
}
