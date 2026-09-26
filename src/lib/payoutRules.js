// Pure Karopay payout rules — no DB, no network, no Node-only imports — shared by the admin Cash Out
// API, the payout webhook and the UI. Every value here comes from Karopay's
// docs (karopay-api-doc.readme.io): "Payout Request", "Supported Bank List",
// "Payout Response" and "Notify Order Result Request".

export const ACCOUNT_TYPES = ["WALLET", "BANK"];
export const WALLET_PROVIDERS = ["EASYPAISA", "JAZZCASH"];
export const BANK_PROVIDERS = [
  "ADVANS_PAKISTAN_MICRO_FINANCE_BANK",
  "ALLIED_BANK_LIMITED",
  "APNA_MICRO_FINANCE_BANK",
  "ASKARI_BANK_LIMITED",
  "BANK_AL_HABIB_LIMITED",
  "BANK_ALFALAH_LIMITED",
  "BANK_ISLAMI_PAKISTAN_LIMITED",
  "CENTRAL_DIRECTORATE_OF_NATIONAL_SAVINGS",
  "CITI_BANK_NA",
  "DUBAI_ISLAMIC_BANK_PAKISTAN_LIMITED",
  "FAYSAL_BANK_LIMITED",
  "HABIB_BANK_LIMITED",
  "HABIB_METROPOLITAN_BANK_LIMITED",
  "HBL_MICRO_FINANCE_BANK",
  "JS_BANK_LIMITED",
  "MCB_ARIF_HABIB",
  "MCB_BANK_LIMITED",
  "MEEZAN_BANK",
  "NATIONAL_BANK_OF_PAKISTAN",
  "NIB_BANK_LIMITED",
  "NRSP_MICRO_FINANCE_BANK",
  "SAMBA_BANK_LIMITED",
  "SILK_BANK_LIMITED",
  "SINDH_BANK_LIMITED",
  "SONERI_BANK_LIMITED",
  "SUMMIT_BANK_LIMITED",
  "THE_BANK_OF_PUNJAB",
  "UNITED_BANK_LIMITED",
];

export const PAYOUT_MAX_AMOUNT = 1000000; // Rs — local sanity cap, not a Karopay limit

// Karopay order status (Payout Response / Order Inquiry Response):
//   99 waiting for submit, 00 paying, 06 wait confirm, 07 customer did not
//   open the URL → still in progress; 01 success; 02 failed.
export const PROVIDER_STATUS_LABELS = {
  "99": "waiting for submit",
  "00": "paying",
  "01": "success",
  "02": "failed",
  "06": "wait confirm",
  "07": "customer did not open the URL",
};

export function mapProviderStatus(status) {
  const s = status == null ? "" : String(status);
  if (s === "01") return "COMPLETED";
  if (s === "02") return "FAILED";
  return "PENDING";
}

const WALLET_OR_PHONE_RE = /^3\d{9}$/;
const CNIC_RE = /^\d{13}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IBAN_RE = /^PK\d{2}[A-Z0-9]{20}$/;

// PKR in → integer paisa ("cent") out, the same convention as
// validateKaropayAmount() in src/lib/payments.js: reject NaN/Infinity,
// <= 0, and anything with more than two decimal places.
export function pkrToCents(amount) {
  const n = typeof amount === "string" && amount.trim() !== "" ? Number(amount) : amount;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0 || n > PAYOUT_MAX_AMOUNT) return null;
  const cents = Math.round(n * 100);
  if (Math.abs(cents - n * 100) > 1e-6) return null;
  return cents;
}

export function makePayoutOrderId() {
  // Web Crypto — available in both Node and the browser, since the Cash Out
  // form generates the id up front to show it in the confirm modal.
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(6));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `cashout_${Date.now()}_${hex}`;
}

export function maskTail(value, visible = 4) {
  const s = String(value || "");
  if (s.length <= visible) return s;
  return `${"*".repeat(Math.max(3, s.length - visible))}${s.slice(-visible)}`;
}

// Validates and normalizes the admin's Cash Out form. Returns
// { value } on success or { errors: { field: message } }.
// `accountOnly` (the Cash Out form) checks just the account + amount — the
// server fills the customer fields from the user profile before validating
// the full payload.
export function validatePayoutInput(input, { accountOnly = false } = {}) {
  const src = input || {};
  const trim = (v) => (v == null ? "" : String(v).trim());
  const errors = {};

  const merchantUserId = trim(src.merchantUserId);
  const accountType = trim(src.accountType).toUpperCase();
  const accountProvider = trim(src.accountProvider).toUpperCase();
  const accountNum = trim(src.accountNum).replace(/[\s-]/g, "");
  const customerName = trim(src.customerName);
  const customerCert = trim(src.customerCert).replace(/-/g, "");
  const customerEmail = trim(src.customerEmail);
  const customerPhone = trim(src.customerPhone).replace(/\s/g, "");
  const customerIBAN = trim(src.customerIBAN).replace(/\s/g, "").toUpperCase();
  const amountCents = pkrToCents(src.amount);

  if (!accountOnly && !merchantUserId) errors.merchantUserId = "User / merchant user ID is required.";
  if (!ACCOUNT_TYPES.includes(accountType)) errors.accountType = "Account type must be WALLET or BANK.";

  if (accountType === "WALLET") {
    if (!WALLET_PROVIDERS.includes(accountProvider)) errors.accountProvider = "Choose EASYPAISA or JAZZCASH.";
    if (!WALLET_OR_PHONE_RE.test(accountNum)) errors.accountNum = "Wallet number must be 10 digits starting with 3 (e.g. 3001234567 or 03001234567).";
  } else if (accountType === "BANK") {
    if (!BANK_PROVIDERS.includes(accountProvider)) errors.accountProvider = "Choose a bank from Karopay's supported bank list.";
    if (!/^[A-Z0-9]{6,34}$/i.test(accountNum)) errors.accountNum = "Enter a valid bank account number.";
  }

  if (amountCents === null) errors.amount = `Enter a valid PKR amount (max Rs${PAYOUT_MAX_AMOUNT.toLocaleString()}, two decimals).`;
  if (!accountOnly) {
    if (!customerName) errors.customerName = "Customer name is required.";
    if (!CNIC_RE.test(customerCert)) errors.customerCert = "CNIC must be exactly 13 digits.";
    if (!EMAIL_RE.test(customerEmail)) errors.customerEmail = "Enter a valid email address.";
    if (!WALLET_OR_PHONE_RE.test(customerPhone)) errors.customerPhone = "Phone must be 10 digits starting with 3.";
  }
  if (customerIBAN && !IBAN_RE.test(customerIBAN)) errors.customerIBAN = "IBAN must look like PK36SCBL0000001123456702.";

  if (Object.keys(errors).length) return { errors };
  return {
    value: {
      merchantUserId,
      accountType,
      accountProvider,
      accountNum,
      amountCents,
      customerName,
      customerCert,
      customerEmail,
      customerPhone,
      customerIBAN: customerIBAN || undefined,
    },
  };
}

// Exact body for POST /open-api/pay/transfer. `amount` is a string in cents.
export function buildPayoutRequestBody(value, { merchantOrderId, notifyUrl, merchantUserIp }) {
  const body = {
    merchantUserId: value.merchantUserId,
    merchantUserIp: merchantUserIp || undefined,
    accountType: value.accountType,
    accountProvider: value.accountProvider,
    accountNum: value.accountNum,
    amount: String(value.amountCents),
    merchantOrderId,
    notifyUrl,
    customerName: value.customerName,
    customerCert: value.customerCert,
    customerEmail: value.customerEmail,
    customerPhone: value.customerPhone,
    customerIBAN: value.customerIBAN,
  };
  for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
  return body;
}

const PRIVATE_HOST_RE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[?::1\]?$)|\.internal$|\.railway\.internal$/i;

// Karopay posts the payout notify server-to-server, so it must be a public
// https URL — never localhost / a private network / Railway's private domain.
export function resolvePayoutNotifyUrl(base) {
  let url;
  try {
    url = new URL(String(base || "").replace(/\/$/, ""));
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || PRIVATE_HOST_RE.test(url.hostname)) return null;
  return `${url.origin}/api/karopay/payout-webhook`;
}
