import mongoose from "mongoose";
import dbConnect from "../../../../../lib/mongodb";
import Payment from "../../../../../lib/models/Payment";
import Transaction from "../../../../../lib/models/Transaction";
import { requireSuperAdmin } from "../../../../../lib/auth";
import { logActivity } from "../../../../../lib/activity";

export async function DELETE(request, { params }) {
  const admin = await requireSuperAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid payment id." }, { status: 400 });

  await dbConnect();
  const payment = await Payment.findOne({ _id: id, provider: "karopay" });
  if (!payment) return Response.json({ error: "Karo Pay payment not found." }, { status: 404 });
  if (!["FAILED", "CANCELLED"].includes(payment.status) || payment.creditedAt) {
    return Response.json({ error: "Only failed or cancelled, uncredited Karo Pay payments can be deleted." }, { status: 409 });
  }

  const depositTransaction = await Transaction.findOne({ "meta.paymentId": payment._id }).select("_id").lean();
  if (depositTransaction) {
    return Response.json({ error: "This payment has a linked deposit transaction and cannot be deleted." }, { status: 409 });
  }

  const deleted = await Payment.findOneAndDelete({
    _id: payment._id,
    provider: "karopay",
    status: { $in: ["FAILED", "CANCELLED"] },
    creditedAt: null,
  });
  if (!deleted) return Response.json({ error: "Payment status changed. Refresh the list and try again." }, { status: 409 });

  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: "karopay_failed_payment_deleted",
    targetUser: payment.userId,
    message: `Deleted uncredited ${payment.status.toLowerCase()} Karo Pay payment ${payment.providerOrderId}; wallet balance was not changed.`,
    meta: { paymentId: payment._id, providerOrderId: payment.providerOrderId, amount: payment.amount, status: payment.status },
  });

  return Response.json({ deleted: true, paymentId: id });
}
