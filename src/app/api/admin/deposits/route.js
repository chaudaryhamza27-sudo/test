import dbConnect from "../../../../lib/mongodb";
import Transaction from "../../../../lib/models/Transaction";
import User from "../../../../lib/models/User";
import { requireAdmin } from "../../../../lib/auth";
import { adjustBalance } from "../../../../lib/wallet";
import { logActivity } from "../../../../lib/activity";
import { notifyUser } from "../../../../lib/notifications";
import { computeTrustScore } from "../../../../lib/trustScore";

const DEPOSIT_STATUSES = ["approved", "completed"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  await dbConnect();
  const raw = await Transaction.find({ type: "deposit" })
    .populate("user", "uid name phone email")
    .sort({ createdAt: -1 })
    .lean();
  // Proof images (up to 5MB each) are fetched on demand via
  // /api/admin/deposits/[id]/proof, not embedded in the list.
  const deposits = raw.map(({ meta, ...d }) => ({
    ...d,
    hasProof: Boolean(meta?.proofImage),
    rejectionReason: meta?.rejectionReason || null,
  }));
  return Response.json({ deposits });
}

export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json();
  const { transactionId, action, rejectionReason } = body || {};
  if (!transactionId || !["approve", "reject"].includes(action)) {
    return Response.json({ error: "transactionId and a valid action are required." }, { status: 400 });
  }

  await dbConnect();

  // Atomically claim the pending transaction so two concurrent approve/reject
  // requests for the same deposit (double-click, two admin tabs) can't both
  // succeed and double-credit the user.
  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, type: "deposit", status: "pending" },
    { $set: { status: action === "approve" ? "approved" : "rejected", reviewedBy: admin._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!tx) {
    const existing = await Transaction.findOne({ _id: transactionId, type: "deposit" });
    if (!existing) return Response.json({ error: "Deposit not found." }, { status: 404 });
    return Response.json({ error: "This deposit has already been reviewed." }, { status: 409 });
  }

  if (action === "approve") {
    const user = await adjustBalance(tx.user, tx.amount);
    if (!user) {
      // Crediting failed after the claim — put the transaction back to pending
      // rather than leaving it marked "approved" without the user being paid.
      await Transaction.updateOne({ _id: tx._id }, { $set: { status: "pending" }, $unset: { reviewedBy: 1, reviewedAt: 1 } });
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    // Re-baseline trust score from lifetime approved deposits — admin can
    // still fetch/adjust it by hand afterward from User Control.
    const depositAgg = await Transaction.aggregate([
      { $match: { user: tx.user, type: "deposit", status: { $in: DEPOSIT_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const lifetimeDeposit = depositAgg[0]?.total ?? 0;
    await User.updateOne(
      { _id: tx.user, $or: [{ trustScoreManual: false }, { trustScoreManual: { $exists: false } }] },
      { $set: { trustScore: computeTrustScore(lifetimeDeposit) } }
    );
  } else if (typeof rejectionReason === "string" && rejectionReason.trim()) {
    // Set the whole meta object (rather than a dotted sub-path) since meta
    // may currently be null, and Mongo can't set a nested path on null.
    tx.meta = { ...(tx.meta || {}), rejectionReason: rejectionReason.trim().slice(0, 300) };
    await Transaction.updateOne({ _id: tx._id }, { $set: { meta: tx.meta } });
  }

  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: action === "approve" ? "deposit_approved" : "deposit_rejected",
    targetUser: tx.user,
    message: `${action === "approve" ? "Approved" : "Rejected"} a virtual deposit of Rs${Number(tx.amount).toLocaleString()}.`,
    meta: { transactionId: tx._id, amount: tx.amount, rejectionReason: tx.meta?.rejectionReason || null },
  });
  await notifyUser(tx.user, {
    type: action === "approve" ? "deposit_approved" : "deposit_rejected",
    title: action === "approve" ? "Deposit approved" : "Deposit rejected",
    message:
      action === "approve"
        ? `Your virtual deposit of Rs${Number(tx.amount).toLocaleString()} has been added.`
        : `Your virtual deposit request of Rs${Number(tx.amount).toLocaleString()} was rejected.${tx.meta?.rejectionReason ? ` Reason: ${tx.meta.rejectionReason}` : ""}`,
  });

  return Response.json({ deposit: { ...tx.toObject(), meta: undefined, hasProof: undefined } });
}
