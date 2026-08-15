import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { requireAdmin } from "../../../../lib/auth";
import { adjustBalance } from "../../../../lib/wallet";
import { logActivity } from "../../../../lib/activity";
import { notifyUser } from "../../../../lib/notifications";

// Balance Manager — add/deduct a delta (as opposed to POST /api/admin/users,
// which force-sets an absolute balance). Reuses the same atomic
// adjustBalance() the deposit/withdraw approval flows use, so a deduction
// can never take a user negative, and every change is reason-logged.
export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json();
  const { userId, delta, reason } = body || {};

  if (!userId) return Response.json({ error: "userId is required." }, { status: 400 });
  const amount = Number(delta);
  if (!Number.isFinite(amount) || amount === 0) {
    return Response.json({ error: "delta must be a non-zero number." }, { status: 400 });
  }
  if (!reason || !String(reason).trim()) {
    return Response.json({ error: "A reason is required for balance changes." }, { status: 400 });
  }

  await dbConnect();
  const target = await User.findById(userId, "-passwordHash");
  if (!target) return Response.json({ error: "User not found." }, { status: 404 });

  const updated = await adjustBalance(userId, amount);
  if (!updated) {
    return Response.json({ error: "Insufficient balance for this deduction." }, { status: 400 });
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
    message: `An administrator ${verb} your demo balance by Rs${Math.abs(amount).toLocaleString()}. Reason: ${reason}`,
  });

  return Response.json({ user: { ...updated.toObject(), passwordHash: undefined } });
}
