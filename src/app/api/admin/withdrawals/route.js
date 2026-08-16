import dbConnect from "../../../../lib/mongodb";
import Transaction from "../../../../lib/models/Transaction";
import { requireAdmin } from "../../../../lib/auth";
import { adjustBalance } from "../../../../lib/wallet";
import { logActivity } from "../../../../lib/activity";
import { notifyUser } from "../../../../lib/notifications";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  await dbConnect();
  const withdrawals = await Transaction.find({ type: "withdraw" })
    .populate("user", "uid name phone email")
    .sort({ createdAt: -1 });
  return Response.json({ withdrawals });
}

export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json();
  const { transactionId, action } = body || {};
  if (!transactionId || !["approve", "reject"].includes(action)) {
    return Response.json({ error: "transactionId and a valid action are required." }, { status: 400 });
  }

  await dbConnect();

  // Atomically claim the pending transaction so two concurrent approve/reject
  // requests for the same withdrawal (double-click, two admin tabs) can't both
  // succeed — e.g. both refunding the held funds back to the user.
  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, type: "withdraw", status: "pending" },
    { $set: { status: action === "approve" ? "approved" : "rejected", reviewedBy: admin._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!tx) {
    const existing = await Transaction.findOne({ _id: transactionId, type: "withdraw" });
    if (!existing) return Response.json({ error: "Withdrawal not found." }, { status: 404 });
    return Response.json({ error: "This withdrawal has already been reviewed." }, { status: 409 });
  }

  if (action === "reject") {
    // Funds were held at request time — refund them back to the user.
    await adjustBalance(tx.user, tx.amount);
  }

  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: action === "approve" ? "withdraw_approved" : "withdraw_rejected",
    targetUser: tx.user,
    message: `${action === "approve" ? "Approved" : "Rejected"} a demo withdrawal of Rs${Number(tx.amount).toLocaleString()}.`,
    meta: { transactionId: tx._id, amount: tx.amount },
  });
  await notifyUser(tx.user, {
    type: action === "approve" ? "withdraw_approved" : "withdraw_rejected",
    title: action === "approve" ? "Withdrawal approved" : "Withdrawal rejected",
    message:
      action === "approve"
        ? `Your demo withdrawal of Rs${Number(tx.amount).toLocaleString()} has been processed.`
        : `Your demo withdrawal request of Rs${Number(tx.amount).toLocaleString()} was rejected and refunded to your balance.`,
  });

  return Response.json({ withdrawal: tx });
}
