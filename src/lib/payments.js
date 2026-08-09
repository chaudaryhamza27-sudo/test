import "server-only";
import Payment from "./models/Payment";
import Transaction from "./models/Transaction";
import User from "./models/User";
import { adjustBalance } from "./wallet";
import { logActivity } from "./activity";
import { notifyUser } from "./notifications";

export const PRESET_DEPOSIT_AMOUNTS = [5, 10, 20, 50, 100];
export const MIN_DEPOSIT_AMOUNT = 1;
export const MAX_DEPOSIT_AMOUNT = 500;
export const MAX_PENDING_ORDERS_PER_MINUTE = 5;

// This merchant's Paybost sandbox account only accepts PKR (USD returns
// "Currency not supported", confirmed by testing directly against
// https://paybost.com/sandbox/payment/initiate) — so unlike the PayPal (USD)
// flow, Paybost deposits are PKR and 1 PKR == 1 demo credit, matching the
// rest of this app's Rs-denominated wallet.
export const PAYBOST_PRESET_DEPOSIT_AMOUNTS = [1000, 3000, 5000, 10000, 25000, 50000];
export const PAYBOST_MIN_DEPOSIT_AMOUNT = 100;
export const PAYBOST_MAX_DEPOSIT_AMOUNT = 100000;

export function validatePaybostAmount(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  if (amount < PAYBOST_MIN_DEPOSIT_AMOUNT || amount > PAYBOST_MAX_DEPOSIT_AMOUNT) return null;
  const paisa = Math.round(amount * 100);
  if (Math.abs(paisa - amount * 100) > 1e-6) return null; // more than 2 decimal places
  return paisa;
}

// Per-provider display label, used for Transaction.method and user-facing
// messages. Add an entry here when a new payment provider is integrated —
// creditVerifiedPayment() itself needs no other changes.
const PROVIDER_LABELS = {
  paypal: "PayPal Sandbox",
  paybost: "Paybost (Test Mode)",
};

// Validates a dollar amount from the client and returns it as integer cents,
// or null if invalid. Rejects non-numeric, negative, zero, NaN, Infinity, and
// anything with more than two decimal places.
export function validateDepositAmount(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  if (amount < MIN_DEPOSIT_AMOUNT || amount > MAX_DEPOSIT_AMOUNT) return null;
  const cents = Math.round(amount * 100);
  if (Math.abs(cents - amount * 100) > 1e-6) return null; // more than 2 decimal places
  return cents;
}

export async function countRecentPendingOrders(userId) {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  return Payment.countDocuments({ userId, status: "PENDING", createdAt: { $gte: oneMinuteAgo } });
}

// The single, shared credit path for both the capture-order endpoint and the
// webhook. Safe to call concurrently or more than once for the same payment —
// only the caller that wins the atomic status claim actually credits the wallet.
export async function creditVerifiedPayment(paymentId, { captureId, rawCaptureResponse }) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: paymentId, status: { $in: ["PENDING", "APPROVED"] } },
    {
      $set: {
        status: "COMPLETED",
        providerCaptureId: captureId,
        creditedAt: new Date(),
        rawCaptureResponse,
      },
    },
    { new: true }
  );

  if (!claimed) {
    // Already completed by a racing request (capture-order vs. webhook, or a
    // duplicate webhook delivery). Return current state — this is a success, not an error.
    const existing = await Payment.findById(paymentId);
    const transaction = existing ? await Transaction.findOne({ "meta.paymentId": existing._id }) : null;
    const user = existing ? await User.findById(existing.userId, "balance") : null;
    return { payment: existing, transaction, balance: user?.balance ?? null, alreadyCredited: true };
  }

  // Integer minor units -> whole demo-credit units. 1 USD == 1 credit for PayPal,
  // 1 PKR == 1 credit for Paybost — both providers store amount as minor-unit cents.
  const creditAmount = claimed.amount / 100;
  const providerLabel = PROVIDER_LABELS[claimed.provider] || claimed.provider;

  const updatedUser = await adjustBalance(claimed.userId, creditAmount);

  const transaction = await Transaction.create({
    user: claimed.userId,
    type: "deposit",
    amount: creditAmount,
    method: providerLabel,
    status: "completed",
    meta: {
      paymentId: claimed._id,
      provider: claimed.provider,
      providerOrderId: claimed.providerOrderId,
      providerCaptureId: claimed.providerCaptureId,
      currency: claimed.currency,
      demo: true,
    },
  });

  await logActivity({
    user: claimed.userId,
    actorRole: "user",
    action: `${claimed.provider}_deposit_completed`,
    message: `${providerLabel} deposit of ${claimed.currency} ${(claimed.amount / 100).toFixed(2)} completed (+${creditAmount} demo credits).`,
    meta: { paymentId: claimed._id, providerOrderId: claimed.providerOrderId },
  });
  await notifyUser(claimed.userId, {
    type: `${claimed.provider}_deposit_completed`,
    title: `${providerLabel} deposit completed`,
    message: `Your demo deposit of Rs${creditAmount.toLocaleString()} via ${providerLabel} has been credited. No real money was processed.`,
  });

  return { payment: claimed, transaction, balance: updatedUser?.balance ?? null, alreadyCredited: false };
}
