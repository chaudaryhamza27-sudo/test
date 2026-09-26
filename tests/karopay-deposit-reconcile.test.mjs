// Karopay deposit auto-credit (webhook fallback) — no network, no database.
// Run: npm run test:payout
import { test, mock, before } from "node:test";
import assert from "node:assert/strict";

const now = Date.now();
const payments = [
  { _id: "ok", userId: "u1", provider: "karopay", providerOrderId: "ok", amount: 50000, currency: "PKR", status: "PENDING", createdAt: new Date(now - 60_000) },
  { _id: "bad", userId: "u1", provider: "karopay", providerOrderId: "bad", amount: 30000, currency: "PKR", status: "PENDING", createdAt: new Date(now - 60_000) },
  { _id: "wait", userId: "u1", provider: "karopay", providerOrderId: "wait", amount: 30000, currency: "PKR", status: "PENDING", createdAt: new Date(now - 60_000) },
  { _id: "odd", userId: "u2", provider: "karopay", providerOrderId: "odd", amount: 30000, currency: "PKR", status: "PENDING", createdAt: new Date(now - 60_000) },
  { _id: "fresh", userId: "u1", provider: "karopay", providerOrderId: "fresh", amount: 30000, currency: "PKR", status: "PENDING", createdAt: new Date(now) },
];
const karopayStatus = {
  ok: { code: 200, status: "01", amount: "50000", orderId: "1" },
  bad: { code: 200, status: "02", amount: "30000" },
  wait: { code: 200, status: "07", amount: "30000" },
  odd: { code: 200, status: "01", amount: "99999" }, // amount mismatch
};
const inquiries = [];
const credits = [];
const alerts = [];

function matches(doc, filter) {
  return Object.entries(filter).every(([k, v]) => {
    if (v && typeof v === "object" && !(v instanceof Date) && ("$gte" in v || "$lte" in v || "$in" in v)) {
      if (v.$gte && !(doc[k] >= v.$gte)) return false;
      if (v.$lte && !(doc[k] <= v.$lte)) return false;
      if (v.$in && !v.$in.includes(doc[k])) return false;
      return true;
    }
    return String(doc[k]) === String(v);
  });
}
const query = (rows) => ({
  sort() { return this; },
  limit(n) { return Promise.resolve(rows.slice(0, n)); },
});

mock.module("../src/lib/models/Payment.js", {
  defaultExport: {
    find: (filter) => query(payments.filter((p) => matches(p, filter))),
    async findOneAndUpdate(filter, update) {
      const p = payments.find((d) => matches(d, filter));
      if (!p) return null;
      Object.assign(p, update.$set);
      return p;
    },
    async updateOne(filter, update) {
      const p = payments.find((d) => matches(d, filter));
      if (p) Object.assign(p, update.$set);
      return { modifiedCount: p ? 1 : 0 };
    },
    async findById(id) {
      return payments.find((p) => p._id === id) || null;
    },
  },
});
mock.module("../src/lib/models/Transaction.js", { defaultExport: { create: async (t) => t, findOne: async () => null } });
mock.module("../src/lib/models/User.js", {
  defaultExport: { updateOne: async () => {}, findById: () => ({ lean: async () => ({ uid: "123456", name: "Ali" }), then: (r) => r({ balance: 0 }) }) },
});
mock.module("../src/lib/telegram.js", {
  namedExports: { sendTelegramMessage: async (text) => alerts.push(text), escapeTelegramHtml: (v) => String(v) },
});
mock.module("../src/lib/wallet.js", {
  namedExports: { adjustBalance: async (user, delta) => (credits.push({ user, delta }), { balance: delta }) },
});
mock.module("../src/lib/activity.js", { namedExports: { logActivity: async () => {} } });
mock.module("../src/lib/notifications.js", { namedExports: { notifyUser: async () => {} } });
mock.module("../src/lib/karopay.js", {
  namedExports: {
    queryOrder: async (id) => {
      inquiries.push(id);
      return karopayStatus[id];
    },
  },
});

let payments_;
before(async () => {
  payments_ = await import("../src/lib/payments.js");
});

test("auto-reconcile credits succeeded deposits exactly once", async () => {
  const settled = await payments_.reconcilePendingKaropayPayments({ userId: "u1" });
  assert.equal(settled, 2); // ok → COMPLETED, bad → FAILED
  assert.equal(payments.find((p) => p._id === "ok").status, "COMPLETED");
  assert.equal(payments.find((p) => p._id === "bad").status, "FAILED");
  assert.equal(payments.find((p) => p._id === "wait").status, "PENDING");
  assert.deepEqual(credits, [{ user: "u1", delta: 500 }]);
  assert.equal(alerts.length, 2, "one completed + one failed Telegram alert");
  assert.match(alerts.find((a) => a.includes("Completed")), /Rs500/);
  assert.ok(alerts.some((a) => a.includes("Failed")));
  assert.ok(!inquiries.includes("fresh"), "too-new payments wait for the webhook first");
  assert.ok(!inquiries.includes("odd"), "other users' payments are not touched");

  // Immediately again: throttled, and already-settled payments are skipped.
  const before = inquiries.length;
  assert.equal(await payments_.reconcilePendingKaropayPayments({ userId: "u1" }), 0);
  assert.equal(inquiries.length, before);
  assert.equal(credits.length, 1);
  assert.equal(alerts.length, 2, "no repeat alerts");
});

test("amount mismatch is never credited", async () => {
  await payments_.reconcilePendingKaropayPayments({ userId: "u2" });
  assert.equal(payments.find((p) => p._id === "odd").status, "PENDING");
  assert.equal(credits.length, 1);
  assert.equal(alerts.length, 2, "no repeat alerts");
});
