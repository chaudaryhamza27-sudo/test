import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import Transaction from "../../../../lib/models/Transaction";
import { requireAdmin } from "../../../../lib/auth";
import { adjustBalance } from "../../../../lib/wallet";
import { logActivity } from "../../../../lib/activity";
import { notifyUser } from "../../../../lib/notifications";
import { computeTrustScore } from "../../../../lib/trustScore";

const DEPOSIT_STATUSES = ["approved", "completed"];

// Balance Manager — add/deduct a delta (as opposed to POST /api/admin/users,
// which force-sets an absolute balance). Reuses the same atomic
// adjustBalance() the deposit/withdraw approval flows use, so a deduction
// can never take a user negative, and every change is reason-logged.
export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json();
  const { userId, delta } = body || {};
  // Optional — the Balance Manager quick panel doesn't collect one, so fall
  // back to a generic note. The audit log entry and amount are still real.
  const reason = String(body?.reason || "").trim() || "Manual balance update via admin Balance Manager.";

  if (!userId) return Response.json({ error: "userId is required." }, { status: 400 });
  const amount = Number(delta);
  if (!Number.isFinite(amount) || amount === 0) {
    return Response.json({ error: "delta must be a non-zero number." }, { status: 400 });
  }

  await dbConnect();
  const target = await User.findById(userId, "-passwordHash");
  if (!target) return Response.json({ error: "User not found." }, { status: 404 });

  const updated = await adjustBalance(userId, amount);
  if (!updated) {
    return Response.json({ error: "Insufficient balance for this deduction." }, { status: 400 });
  }

  // A credit here often means the admin is manually fulfilling a deposit the
  // user already requested (rather than clicking Approve on it) — so the
  // oldest pending deposit request for this amount is marked approved too,
  // instead of being left stuck on "pending" forever. Only the status
  // changes; the balance was already credited above, so adjustBalance is not
  // called again here (that would double-credit the user).
  if (amount > 0) {
    const matchingDeposit = await Transaction.findOneAndUpdate(
      { user: userId, type: "deposit", status: "pending", amount },
      { $set: { status: "approved", reviewedBy: admin._id, reviewedAt: new Date() } },
      { sort: { createdAt: 1 } }
    );
    if (matchingDeposit) {
      const depositAgg = await Transaction.aggregate([
        { $match: { user: target._id, type: "deposit", status: { $in: DEPOSIT_STATUSES } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const lifetimeDeposit = depositAgg[0]?.total ?? 0;
      await User.updateOne(
        { _id: target._id, $or: [{ trustScoreManual: false }, { trustScoreManual: { $exists: false } }] },
        { $set: { trustScore: computeTrustScore(lifetimeDeposit) } }
      );
    }
  }

  const verb = amount > 0 ? "credited" : "debited";
  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: "balance_adjusted",
    targetUser: target._id,
    message: `${verb === "credited" ? "Credited" : "Debited"} Rs${Math.abs(amount).toLocaleString()} ${verb === "credited" ? "to" : "from"} ${target.uid}'s balance. Reason: ${reason}`,
    meta: { delta: amount, reason, previousBalance: target.balance, newBalance: updated.balance },
  });
  await notifyUser(target._id, {
    type: "balance_adjusted",
    title: "Balance updated",
    message: `An administrator ${verb} your virtual balance by Rs${Math.abs(amount).toLocaleString()}. Reason: ${reason}`,
  });

  return Response.json({ user: { ...updated.toObject(), passwordHash: undefined } });
}
