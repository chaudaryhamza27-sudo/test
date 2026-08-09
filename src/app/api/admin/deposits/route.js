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
  const deposits = await Transaction.find({ type: "deposit" })
    .populate("user", "uid phone email")
    .sort({ createdAt: -1 });
  return Response.json({ deposits });
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
  }

  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: action === "approve" ? "deposit_approved" : "deposit_rejected",
    targetUser: tx.user,
    message: `${action === "approve" ? "Approved" : "Rejected"} a demo deposit of Rs${Number(tx.amount).toLocaleString()}.`,
    meta: { transactionId: tx._id, amount: tx.amount },
  });
  await notifyUser(tx.user, {
    type: action === "approve" ? "deposit_approved" : "deposit_rejected",
    title: action === "approve" ? "Deposit approved" : "Deposit rejected",
    message:
      action === "approve"
        ? `Your demo deposit of Rs${Number(tx.amount).toLocaleString()} has been credited.`
        : `Your demo deposit request of Rs${Number(tx.amount).toLocaleString()} was rejected.`,
  });

  return Response.json({ deposit: tx });
}
