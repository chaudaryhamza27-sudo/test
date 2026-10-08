import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const REQUEST_TIMEOUT_MS = 15000;
const COLLECTION_PATH = "/api/pay";
const COLLECTION_QUERY_PATH = "/api/pay/query";
const PAYOUT_PATH = "/api/remit";
const PAYOUT_QUERY_PATH = "/api/remit/query";

export class NgPayError extends Error {
  constructor(message, { status = 502, uncertain = false, detail } = {}) {
    super(message);
    this.name = "NgPayError";
    this.status = status;
    this.uncertain = uncertain;
    this.detail = detail;
  }
}

export function getNgPayConfig() {
  const { NGPAY_MERCHANT_NO: merchantNo, NGPAY_API_KEY: apiKey } = process.env;
  if (!merchantNo || !apiKey) {
    throw new Error("NG Pay is not configured. Set NGPAY_MERCHANT_NO and NGPAY_API_KEY.");
  }
  return {
    merchantNo,
    apiKey,
    productNo: process.env.NGPAY_PRODUCT_NO || "999",
    apiBase: (process.env.NGPAY_API_BASE || "https://api.ng-pay.com").replace(/\/+$/, ""),
  };
}

export function buildNgPaySignContent(data, apiKey) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("NG Pay signing data must be a flat object.");
  }
  if (typeof apiKey !== "string" || !apiKey) {
    throw new Error("NGPAY_API_KEY is required to sign requests.");
  }

  const pairs = Object.keys(data)
    .filter((key) => key !== "sign" && data[key] !== null && data[key] !== undefined && data[key] !== "")
    .sort()
    .map((key) => {
      const value = data[key];
      if (typeof value === "object") throw new TypeError(`NG Pay signing value for ${key} must be scalar.`);
      return `${key}=${String(value)}`;
    });

  return `${pairs.length ? `${pairs.join("&")}&` : ""}key=${apiKey}`;
}

export function signNgPayData(data, apiKey = process.env.NGPAY_API_KEY) {
  return createHash("md5").update(buildNgPaySignContent(data, apiKey), "utf8").digest("hex").toUpperCase();
}

export function verifyNgPayDataSign(data, apiKey = process.env.NGPAY_API_KEY) {
  if (typeof data?.sign !== "string" || !/^[a-f\d]{32}$/i.test(data.sign)) return false;
  const received = Buffer.from(data.sign.toUpperCase(), "ascii");
  const expected = Buffer.from(signNgPayData(data, apiKey), "ascii");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function makeNgPayOrderNo() {
  return `ngp_${Date.now()}_${randomBytes(6).toString("hex")}`;
}

export function formatNgPayAmount(paisa) {
  if (!Number.isSafeInteger(paisa) || paisa <= 0) throw new TypeError("Amount must be positive integer paisa.");
  return (paisa / 100).toFixed(2);
}

export function parseNgPayAmount(amount) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(amount ?? ""));
  if (!match) return null;
  const rupees = Number(match[1]);
  const paisa = Number((match[2] || "").padEnd(2, "0")) || 0;
  const total = rupees * 100 + paisa;
  return Number.isSafeInteger(total) ? total : null;
}

export function mapNgPayStatus(status) {
  switch (String(status)) {
    case "0": return "COMPLETED";
    case "1": return "FAILED";
    case "99": return "REFUNDED";
    case "2":
    case "3":
    default: return "PENDING";
  }
}

async function postNgPay(path, fields) {
  const config = getNgPayConfig();
  const payload = {
    ...fields,
    merchantNo: config.merchantNo,
    timestamp: String(Date.now()),
  };
  payload.sign = signNgPayData(payload, config.apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${config.apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    throw new NgPayError(
      err?.name === "AbortError" ? "NG Pay request timed out." : "Could not reach NG Pay.",
      { status: err?.name === "AbortError" ? 504 : 502, uncertain: true }
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let envelope;
  try {
    envelope = JSON.parse(text);
  } catch {
    throw new NgPayError("NG Pay returned an invalid response.", {
      status: 502,
      uncertain: true,
      detail: { httpStatus: response.status },
    });
  }

  if (!response.ok || Number(envelope?.code) !== 200) {
    throw new NgPayError(envelope?.msg || "NG Pay rejected the request.", {
      status: response.status >= 400 && response.status < 600 ? response.status : 502,
      detail: { httpStatus: response.status, code: envelope?.code, msg: envelope?.msg },
    });
  }

  if (!envelope.data || !verifyNgPayDataSign(envelope.data, config.apiKey)) {
    throw new NgPayError("NG Pay response signature verification failed.", {
      status: 502,
      uncertain: true,
      detail: { httpStatus: response.status, code: envelope.code },
    });
  }
  return envelope.data;
}

// The checkout link's field name isn't fixed across NG Pay products, so take
// the first http(s) URL among the names it's known to use.
export function pickNgPayCheckoutUrl(data) {
  for (const key of ["payUrl", "payLink", "cashierUrl", "url", "h5Url", "payData"]) {
    const value = data?.[key];
    if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  }
  return null;
}

export async function createNgPayCollectionOrder({ merchantOrderNo, amount, payType, productTitle, notifyUrl, viewUrl, clientIp }) {
  const { productNo } = getNgPayConfig();
  return postNgPay(COLLECTION_PATH, {
    merchantOrderNo,
    amount,
    coinUnit: "PKR",
    payType,
    productNo,
    productTitle,
    notifyUrl,
    viewUrl: viewUrl || "",
    clientIp,
    extend: "",
  });
}

export async function queryNgPayCollectionOrder({ merchantOrderNo, orderNo = "" }) {
  return postNgPay(COLLECTION_QUERY_PATH, { merchantOrderNo, orderNo });
}

export async function createNgPayPayoutOrder({ amount, payType, bankCode, bankAccountNo, bankAccountName, notifyUrl, extend = "" }) {
  const { productNo } = getNgPayConfig();
  return postNgPay(PAYOUT_PATH, {
    amount,
    coinUnit: "PKR",
    payType,
    productNo,
    bankCode,
    bankAccountNo,
    bankAccountName,
    notifyUrl,
    extend,
  });
}

export async function queryNgPayPayoutOrder({ merchantOrderNo, orderNo = "" }) {
  return postNgPay(PAYOUT_QUERY_PATH, { merchantOrderNo, orderNo });
}