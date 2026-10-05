// Karopay Cash Out tests — no network, no database, no real payout.
// Run: npm run test:payout
import { test, mock, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.KAROPAY_APP_ID = "44123456789";
process.env.KAROPAY_SIGN_KEY = "03412138d41f";
process.env.KAROPAY_API_BASE = "https://karopay.test";

const md5 = (s) => crypto.createHash("md5").update(s, "utf8").digest("hex");

// ---- in-memory fakes for the mongoose models used by src/lib/payouts.js ----
function matches(doc, filter) {
  return Object.entries(filter).every(([k, v]) => {
    const actual = k.split(".").reduce((o, part) => (o == null ? undefined : o[part]), doc);
    return String(actual) === String(v);
  });
}
function applySet(doc, set = {}, inc = {}) {
  for (const [k, v] of Object.entries(set)) {
    const parts = k.split(".");
    let o = doc;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    o[parts.at(-1)] = v;
  }
  for (const [k, v] of Object.entries(inc)) doc[k] = (doc[k] || 0) + v;
}
function fakeModel(rows) {
  return {
    rows,
    async findOne(filter) {
      return rows.find((r) => matches(r, filter)) || null;
    },
    async updateOne(filter, update) {
      const r = rows.find((d) => matches(d, filter));
      if (r) applySet(r, update.$set, update.$inc);
      return { matchedCount: r ? 1 : 0 };
    },
    async findOneAndUpdate(filter, update) {
      const r = rows.find((d) => matches(d, filter));
      if (!r) return null;
      applySet(r, update.$set, update.$inc);
      return r;
    },
  };
}

const payoutRows = [];
const txRows = [];
const balanceCalls = [];
const FakePayout = fakeModel(payoutRows);
const FakeTransaction = fakeModel(txRows);

mock.module("../src/lib/models/Payout.js", { defaultExport: FakePayout });
mock.module("../src/lib/models/Transaction.js", { defaultExport: FakeTransaction });
mock.module("../src/lib/wallet.js", {
  namedExports: { adjustBalance: async (user, delta) => balanceCalls.push({ user, delta }) },
});
mock.module("../src/lib/activity.js", { namedExports: { logActivity: async () => {} } });
mock.module("../src/lib/notifications.js", { namedExports: { notifyUser: async () => {} } });

let karopay, rules, payouts;
before(async () => {
  karopay = await import("../src/lib/karopay.js");
  rules = await import("../src/lib/payoutRules.js");
  payouts = await import("../src/lib/payouts.js");
});

// ---- auth header ----
test("auth header matches the documented test vector", async () => {
  // Doc vector: appId 44123456789, signKey 03412138d41f, utcTime 20240307001053 → e91eaa02749325eb77acc2a68741d605
  assert.equal(md5(`44123456789:${md5("03412138d41f")}:20240307001053`), "e91eaa02749325eb77acc2a68741d605");

  let captured;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    captured = { url, opts };
    return new Response(JSON.stringify({ code: 200, balance: "887310", freezeBalance: "0" }), { status: 200 });
  };
  try {
    const bal = await karopay.queryMerchantBalance();
    assert.deepEqual([bal.balanceCents, bal.freezeBalanceCents], [887310, 0]);
  } finally {
    globalThis.fetch = realFetch;
  }
  const h = captured.opts.headers;
  assert.equal(captured.url, "https://karopay.test/open-api/pay/queryBalance");
  assert.match(h.UtcTime, /^\d{14}$/);
  assert.equal(h.AppId, "44123456789");
  assert.equal(h.Authorization, md5(`44123456789:${md5("03412138d41f")}:${h.UtcTime}`));
});

test("collection request uses QR checkout only for EasyPaisa", async () => {
  const requests = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    requests.push(JSON.parse(opts.body));
    return new Response(JSON.stringify({ code: 200, payUrl: "https://karopay.test/checkout" }), { status: 200 });
  };

  const collection = {
    merchantOrderId: "order-1",
    merchantUserId: "user-1",
    amount: "10000",
    returnUrl: "https://example.test/return",
    notifyUrl: "https://example.test/notify",
    customerName: "Ali Khan",
    customerCert: "3520112345671",
    customerEmail: "ali@example.com",
    customerPhone: "3001234567",
  };
  try {
    const result = await karopay.createCollectionOrder({
      ...collection,
      defaultChannelName: "easypaisa",
      isQrCodeVersion: true,
    });
    assert.equal(result.payUrl, "https://karopay.test/checkout");
    await karopay.createCollectionOrder({ ...collection, defaultChannelName: "jazzcash" });
  } finally {
    globalThis.fetch = realFetch;
  }

  assert.equal(requests[0].checkoutType, "url");
  assert.equal(requests[0].isQrCodeVersion, true);
  assert.equal(requests[0].fixedChannelName, "qrcode:easypaisa");
  assert.equal(requests[0].defaultChannelName, "easypaisa");
  assert.equal(requests[1].isQrCodeVersion, false);
  assert.equal("fixedChannelName" in requests[1], false);
  assert.equal(requests[1].defaultChannelName, "jazzcash");
});

// ---- validation ----
const base = {
  merchantUserId: "u1",
  accountType: "WALLET",
  accountProvider: "EASYPAISA",
  accountNum: "3001234567",
  amount: "500",
  customerName: "Ali Khan",
  customerCert: "3520112345671",
  customerEmail: "ali@example.com",
  customerPhone: "3001234567",
};

test("valid WALLET payout passes and converts PKR to cents", () => {
  const { value, errors } = rules.validatePayoutInput(base);
  assert.equal(errors, undefined);
  assert.equal(value.amountCents, 50000);
});

test("WALLET account number must be 10 digits starting with 3", () => {
  for (const bad of ["03001234567", "300123456", "4001234567", "abc"]) {
    assert.ok(rules.validatePayoutInput({ ...base, accountNum: bad }).errors.accountNum, bad);
  }
  assert.ok(rules.validatePayoutInput({ ...base, accountProvider: "MEEZAN_BANK" }).errors.accountProvider);
});

test("BANK requires a documented bank code", () => {
  const bank = { ...base, accountType: "BANK", accountProvider: "MEEZAN_BANK", accountNum: "6029120301123456789" };
  assert.equal(rules.validatePayoutInput(bank).errors, undefined);
  assert.ok(rules.validatePayoutInput({ ...bank, accountProvider: "EASYPAISA" }).errors.accountProvider);
  assert.ok(rules.validatePayoutInput({ ...bank, accountProvider: "FAKE_BANK" }).errors.accountProvider);
  assert.equal(rules.BANK_PROVIDERS.length, 28);
});

test("CNIC, phone, email, IBAN and amount rules", () => {
  assert.ok(rules.validatePayoutInput({ ...base, customerCert: "123" }).errors.customerCert);
  assert.ok(rules.validatePayoutInput({ ...base, customerPhone: "03001234567" }).errors.customerPhone);
  assert.ok(rules.validatePayoutInput({ ...base, customerEmail: "nope" }).errors.customerEmail);
  assert.ok(rules.validatePayoutInput({ ...base, customerIBAN: "XX12" }).errors.customerIBAN);
  assert.equal(rules.validatePayoutInput({ ...base, customerIBAN: "PK36SCBL0000001123456702" }).errors, undefined);
  assert.equal(rules.pkrToCents("100.25"), 10025);
  for (const bad of ["0", "-5", "1.234", "abc", ""]) assert.equal(rules.pkrToCents(bad), null, bad);
});

test("merchantOrderId is unique and well-formed", () => {
  const ids = new Set(Array.from({ length: 2000 }, () => rules.makePayoutOrderId()));
  assert.equal(ids.size, 2000);
  for (const id of ids) assert.match(id, /^cashout_\d{13}_[a-f0-9]{12}$/);
});

test("notify URL must be public https", () => {
  assert.equal(rules.resolvePayoutNotifyUrl("https://lucky73.online"), "https://lucky73.online/api/karopay/payout-webhook");
  for (const bad of ["http://lucky73.online", "https://localhost:3000", "https://127.0.0.1", "https://app.railway.internal", "https://192.168.1.5"]) {
    assert.equal(rules.resolvePayoutNotifyUrl(bad), null, bad);
  }
});

// ---- request body + provider calls (fetch mocked) ----
test("payout request body shape and error handling", async () => {
  const { value } = rules.validatePayoutInput({ ...base, customerIBAN: "PK36SCBL0000001123456702" });
  const body = rules.buildPayoutRequestBody(value, {
    merchantOrderId: "cashout_1_abc",
    notifyUrl: "https://lucky73.online/api/karopay/payout-webhook",
    merchantUserIp: "1.2.3.4",
  });
  assert.deepEqual(Object.keys(body).sort(), [
    "accountNum", "accountProvider", "accountType", "amount", "customerCert", "customerEmail",
    "customerIBAN", "customerName", "customerPhone", "merchantOrderId", "merchantUserId", "merchantUserIp", "notifyUrl",
  ]);
  assert.equal(body.amount, "50000");

  const realFetch = globalThis.fetch;
  try {
    let sent;
    globalThis.fetch = async (url, opts) => {
      sent = { url, body: JSON.parse(opts.body) };
      // int64 orderId beyond MAX_SAFE_INTEGER must survive exactly
      return new Response('{"code":200,"msg":"success","status":"99","orderId":1549087817064251392,"traceId":"t1","fee":"1500"}', { status: 200 });
    };
    const ok = await karopay.createPayoutOrder(body);
    assert.equal(sent.url, "https://karopay.test/open-api/pay/transfer");
    assert.deepEqual(sent.body, body);
    assert.equal(ok.orderId, "1549087817064251392");

    globalThis.fetch = async () => new Response('{"code":500,"msg":"insufficient balance","traceId":"t2"}', { status: 200 });
    await assert.rejects(karopay.createPayoutOrder(body), (e) => e.detail.code === 500 && e.detail.msg === "insufficient balance" && e.detail.traceId === "t2");

    globalThis.fetch = async () => new Response("Access denied, your ip is: 1.1.1.1", { status: 403 });
    await assert.rejects(karopay.createPayoutOrder(body), (e) => e.detail.ipBlocked === true && /whitelist/.test(e.message));

    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    // Network failure → no detail object: the route keeps the payout PENDING instead of failing it.
    await assert.rejects(karopay.createPayoutOrder(body), (e) => e.detail instanceof Error);
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ---- callback signature ----
function signPayload(payload) {
  const keys = Object.keys(payload).filter((k) => k !== "sign" && payload[k] !== "" && payload[k] != null).sort();
  return md5(keys.map((k) => `${k}=${payload[k]}&`).join("") + `key=${md5(process.env.KAROPAY_SIGN_KEY)}`);
}

test("callback sign verification (doc procedure) incl. int64 orderId", () => {
  const raw = '{"code":200,"msg":"success","status":"01","amount":"50000","fee":"150","orderId":1549087817064251392,"merchantOrderId":"cashout_1_abc","payType":"120","traceId":"t"}';
  const parsed = karopay.parseKaropayJson(raw);
  const signed = { ...parsed, sign: signPayload(parsed) };
  assert.equal(signed.orderId, "1549087817064251392");
  assert.equal(karopay.verifyCallbackSign(signed), true);
  assert.equal(karopay.verifyCallbackSign({ ...signed, amount: "99999" }), false);
  assert.equal(karopay.verifyCallbackSign({ ...signed, sign: undefined }), false);
  // A plain JSON.parse rounds the int64 and would break verification.
  const rounded = JSON.parse(raw);
  assert.notEqual(String(rounded.orderId), "1549087817064251392");
});

// ---- idempotent status application ----
test("callbacks are idempotent: complete once, never refund a completed payout", async () => {
  txRows.push({ _id: "tx1", user: "user1", amount: 500, status: "approved", meta: { payoutOrderId: "co_1" } });
  payoutRows.push({ _id: "p1", merchantOrderId: "co_1", amount: 50000, status: "PENDING", withdrawal: "tx1", user: "user1" });

  const pending = await payouts.applyPayoutResult("co_1", { status: "00", orderId: "9" }, { source: "callback" });
  assert.equal(pending.status, "PENDING");

  const first = await payouts.applyPayoutResult("co_1", { status: "01", amount: "50000", fee: "150" }, { source: "callback" });
  const second = await payouts.applyPayoutResult("co_1", { status: "01", amount: "50000" }, { source: "callback" });
  const lateFail = await payouts.applyPayoutResult("co_1", { status: "02" }, { source: "callback" });
  assert.equal(first.status, "COMPLETED");
  assert.equal(second.duplicate, true);
  assert.equal(lateFail.duplicate, true);
  assert.equal(payoutRows[0].status, "COMPLETED");
  assert.equal(payoutRows[0].callbackCount, 4);
  assert.equal(txRows[0].status, "completed");
  assert.equal(balanceCalls.length, 0);
});

test("failed payout refunds the held withdrawal exactly once", async () => {
  txRows.push({ _id: "tx2", user: "user2", amount: 700, status: "approved", meta: { payoutOrderId: "co_2" } });
  payoutRows.push({ _id: "p2", merchantOrderId: "co_2", amount: 70000, status: "PENDING", withdrawal: "tx2", user: "user2" });

  await payouts.applyPayoutResult("co_2", { status: "02" }, { source: "callback" });
  await payouts.applyPayoutResult("co_2", { status: "02" }, { source: "callback" });
  assert.equal(payoutRows[1].status, "FAILED");
  assert.equal(txRows[1].status, "rejected");
  assert.deepEqual(balanceCalls, [{ user: "user2", delta: 700 }]);
});

test("success with a mismatched amount is not completed", async () => {
  payoutRows.push({ _id: "p3", merchantOrderId: "co_3", amount: 10000, status: "PENDING", withdrawal: null });
  const r = await payouts.applyPayoutResult("co_3", { status: "01", amount: "99999" }, { source: "callback" });
  assert.equal(r.mismatch, true);
  assert.equal(payoutRows[2].status, "PENDING");
});

test("unknown merchantOrderId is ignored", async () => {
  assert.deepEqual(await payouts.applyPayoutResult("nope", { status: "01" }, { source: "callback" }), { found: false });
});
