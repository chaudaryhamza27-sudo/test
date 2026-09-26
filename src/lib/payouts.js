import "server-only";
import Payout from "./models/Payout";
import Transaction from "./models/Transaction";
import { adjustBalance } from "./wallet";
import { logActivity } from "./activity";
import { notifyUser } from "./notifications";
import { mapProviderStatus } from "./payoutRules";

function numOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Karopay fields worth keeping from a payout response / inquiry / notify.
function providerFields(data) {
  const set = {};
  if (data?.orderId != null && data.orderId !== "") set.providerOrderId = String(data.orderId);
  if (data?.status != null && data.status !== "") set.providerStatus = String(data.status);
  if (numOrNull(data?.code) !== null) set.providerCode = numOrNull(data.code);
  if (data?.msg != null) set.providerMsg = String(data.msg).slice(0, 300);
  if (numOrNull(data?.fee) !== null) set.fee = numOrNull(data.fee);
  if (data?.transferReceipt) set.transferReceipt = String(data.transferReceipt);
  if (data?.traceId) set.traceId = String(data.traceId);
  return set;
}

// Moves a pending user withdrawal into "approved" and tags it with the payout
// order id, atomically, so the same withdrawal can never be paid out twice
// (double-click, two admin tabs, a retried request).
export async function claimWithdrawalForPayout(withdrawalId, admin, merchantOrderId) {
  const tx = await Transaction.findOne({ _id: withdrawalId, type: "withdraw" });
  if (!tx) return { error: "Withdrawal not found.", status: 404 };
  if (tx.status !== "pending") return { error: "This withdrawal has already been reviewed or paid out.", status: 409 };

  const claimed = await Transaction.findOneAndUpdate(
    { _id: withdrawalId, type: "withdraw", status: "pending" },
    {
      $set: {
        status: "approved",
        reviewedBy: admin._id,
        reviewedAt: new Date(),
        meta: { ...(tx.meta || {}), payoutOrderId: merchantOrderId, payoutStatus: "PENDING" },
      },
    },
    { new: true }
  );
  if (!claimed) return { error: "This withdrawal has already been reviewed or paid out.", status: 409 };
  return { tx: claimed };
}

// Karopay definitively rejected the payout request itself (nothing was sent),
// so hand the withdrawal back to the admin queue. If the user has since
// opened another pending withdrawal (one-pending-per-user index), reject this
// one and refund the held funds instead.
export async function releaseWithdrawalClaim(withdrawalId, merchantOrderId) {
  try {
    await Transaction.updateOne(
      { _id: withdrawalId, status: "approved", "meta.payoutOrderId": merchantOrderId },
      { $set: { status: "pending", reviewedBy: null, reviewedAt: null, "meta.payoutStatus": "REQUEST_REJECTED" } }
    );
  } catch (err) {
    if (err?.code !== 11000) throw err;
    await failWithdrawal(withdrawalId, merchantOrderId);
  }
}

async function failWithdrawal(withdrawalId, merchantOrderId) {
  const tx = await Transaction.findOneAndUpdate(
    { _id: withdrawalId, status: "approved", "meta.payoutOrderId": merchantOrderId },
    { $set: { status: "rejected", "meta.payoutStatus": "FAILED" } },
    { new: true }
  );
  if (!tx) return null;
  await adjustBalance(tx.user, tx.amount);
  await notifyUser(tx.user, {
    type: "withdraw_rejected",
    title: "Withdrawal failed",
    message: `Your withdrawal of Rs${Number(tx.amount).toLocaleString()} could not be paid out and was refunded to your balance.`,
  });
  return tx;
}

async function completeWithdrawal(withdrawalId, merchantOrderId) {
  const tx = await Transaction.findOneAndUpdate(
    { _id: withdrawalId, status: "approved", "meta.payoutOrderId": merchantOrderId },
    { $set: { status: "completed", "meta.payoutStatus": "COMPLETED" } },
    { new: true }
  );
  if (!tx) return null;
  await notifyUser(tx.user, {
    type: "withdraw_approved",
    title: "Withdrawal paid",
    message: `Your withdrawal of Rs${Number(tx.amount).toLocaleString()} has been paid out.`,
  });
  return tx;
}

// Applies a Karopay order status (from the notify callback or an order
// inquiry) to a payout. Idempotent: only the caller that wins the atomic
// PENDING → COMPLETED/FAILED claim touches the withdrawal or the user's
// balance, so a repeated callback can never complete or refund twice.
export async function applyPayoutResult(merchantOrderId, data, { source, rawCallback } = {}) {
  const payout = await Payout.findOne({ merchantOrderId });
  if (!payout) return { found: false };

  const fields = providerFields(data);
  const inc = source === "callback" ? { callbackCount: 1 } : {};
  const extra = rawCallback ? { rawCallback } : {};
  const target = mapProviderStatus(data?.status);

  if (target === "COMPLETED") {
    const reported = numOrNull(data?.amount);
    if (reported !== null && Math.round(reported) !== payout.amount) {
      console.error("[payouts] amount mismatch — not completing", {
        merchantOrderId,
        expectedCents: payout.amount,
        reportedCents: reported,
      });
      await Payout.updateOne({ _id: payout._id }, { $set: { ...fields, ...extra }, $inc: inc });
      return { found: true, status: payout.status, mismatch: true };
    }
  }

  if (target === "PENDING") {
    await Payout.updateOne({ _id: payout._id, status: "PENDING" }, { $set: { ...fields, ...extra }, $inc: inc });
    return { found: true, status: "PENDING" };
  }

  const claimed = await Payout.findOneAndUpdate(
    { _id: payout._id, status: "PENDING" },
    {
      $set: { ...fields, ...extra, status: target, ...(target === "COMPLETED" ? { completedAt: new Date() } : { failedAt: new Date() }) },
      $inc: inc,
    },
    { new: true }
  );
  if (!claimed) {
    // Already finalized — a duplicate notify. Just count it.
    if (source === "callback") await Payout.updateOne({ _id: payout._id }, { $inc: inc });
    return { found: true, status: payout.status, duplicate: true };
  }

  if (claimed.withdrawal) {
    if (target === "COMPLETED") await completeWithdrawal(claimed.withdrawal, merchantOrderId);
    else await failWithdrawal(claimed.withdrawal, merchantOrderId);
  }

  await logActivity({
    actorRole: "system",
    action: target === "COMPLETED" ? "karopay_payout_completed" : "karopay_payout_failed",
    targetUser: claimed.user,
    message: `Karopay payout ${merchantOrderId} ${target === "COMPLETED" ? "completed" : "failed"} (Rs${(claimed.amount / 100).toLocaleString()}, via ${source}).`,
    meta: { payoutId: claimed._id, merchantOrderId, providerStatus: fields.providerStatus, traceId: fields.traceId },
  });

  return { found: true, status: target };
}

export function serializePayout(p) {
  return {
    id: String(p._id),
    createdAt: p.createdAt,
    merchantOrderId: p.merchantOrderId,
    merchantUserId: p.merchantUserId,
    user: p.user && typeof p.user === "object" && p.user.uid ? { uid: p.user.uid, name: p.user.name, email: p.user.email } : null,
    withdrawal: p.withdrawal ? String(p.withdrawal._id || p.withdrawal) : null,
    amount: p.amount / 100,
    accountType: p.accountType,
    accountProvider: p.accountProvider,
    accountNumMasked: p.accountNumMasked,
    customerName: p.customerName,
    status: p.status,
    providerStatus: p.providerStatus,
    providerMsg: p.providerMsg,
    providerOrderId: p.providerOrderId,
    fee: p.fee != null ? p.fee / 100 : null,
    transferReceipt: p.transferReceipt,
    traceId: p.traceId,
  };
}
