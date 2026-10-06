import mongoose from "mongoose";
import dbConnect from "../../../../../../lib/mongodb";
import Payout from "../../../../../../lib/models/Payout";
import { requireAdminAccess } from "../../../../../../lib/auth";
import { logActivity } from "../../../../../../lib/activity";

export async function DELETE(request, { params }) {
  const access = await requireAdminAccess();
  if (!access) return Response.json({ error: "Forbidden." }, { status: 403 });
  const { admin, isSuperAdmin } = access;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid payout id." }, { status: 400 });

  await dbConnect();
  const scope = isSuperAdmin ? {} : { createdBy: admin._id };
  const payout = await Payout.findOneAndDelete({ _id: id, status: "FAILED", ...scope });
  if (!payout) {
    const existing = await Payout.findOne({ _id: id, ...scope }).select("status").lean();
    if (!existing) return Response.json({ error: "Payout not found." }, { status: 404 });
    return Response.json({ error: "Only provider-confirmed failed payouts can be deleted." }, { status: 409 });
  }

  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: "karopay_failed_payout_deleted",
    targetUser: payout.user,
    message: `Deleted failed Karopay payout history ${payout.merchantOrderId}; no additional balance change was made.`,
    meta: {
      payoutId: payout._id,
      merchantOrderId: payout.merchantOrderId,
      providerOrderId: payout.providerOrderId,
      providerCode: payout.providerCode,
      amount: payout.amount,
      withdrawalId: payout.withdrawal,
    },
  });

  return Response.json({ deleted: true, payoutId: id });
}
