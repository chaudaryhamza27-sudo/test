import User from "./models/User";
import Transaction from "./models/Transaction";

// Atomically adjusts a user's balance. When delta is negative, the update only
// applies if the user currently has enough balance, which prevents the
// read-modify-save race that would otherwise let concurrent requests double-spend.
export async function adjustBalance(userId, delta) {
  const filter = { _id: userId };
  if (delta < 0) filter.balance = { $gte: -delta };

  const user = await User.findOneAndUpdate(filter, { $inc: { balance: delta } }, { new: true });
  return user; // null means the guard failed (insufficient balance) or the user doesn't exist
}

// Anti-abuse gate: a user must have at least one admin-verified (or
// instantly-verified gateway) deposit before they can withdraw — otherwise
// the starter demo balance itself could be withdrawn with no deposit ever
// having happened. Not an amount check — a still-pending deposit doesn't
// count no matter how large.
const VERIFIED_DEPOSIT_STATUSES = ["approved", "completed"];

export async function getWithdrawEligibility(userId) {
  const [verifiedCount, pendingCount] = await Promise.all([
    Transaction.countDocuments({ user: userId, type: "deposit", status: { $in: VERIFIED_DEPOSIT_STATUSES } }),
    Transaction.countDocuments({ user: userId, type: "deposit", status: "pending" }),
  ]);
  if (verifiedCount > 0) return { eligible: true, reason: null };
  if (pendingCount > 0) return { eligible: false, reason: "pending_deposit" };
  return { eligible: false, reason: "no_deposit" };
}
