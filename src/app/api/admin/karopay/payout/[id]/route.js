import mongoose from "mongoose";
import dbConnect from "../../../../../../lib/mongodb";
import Payout from "../../../../../../lib/models/Payout";
import { requireAdminAccess } from "../../../../../../lib/auth";
import { logActivity } from "../../../../../../lib/activity";

export async function DELETE(request, { params }) {
  const isSuperAdmin = new URL(request.url).searchParams.get("scope") === "superadmin";
  const access = await requireAdminAccess(isSuperAdmin ? "superadmin" : "admin");
  if (!access) return Response.json({ error: "Forbidden." }, { status: 403 });
  const { admin } = access;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid payout id." }, { status: 400 });

  await dbConnect();
  const scope = isSuperAdmin ? {} : { createdByScope: "admin", createdBy: admin._id };
  const allowedStatuses = isSuperAdmin ? ["FAILED", "COMPLETED"] : ["FAILED"];
  const payout = await Payout.findOneAndDelete({ _id: id, status: { $in: allowedStatuses }, ...scope });
  if (!payout) {
    const existing = await Payout.findOne({ _id: id, ...scope }).select("status").lean();
    if (!existing) return Response.json({ error: "Payout not found." }, { status: 404 });
    if (existing.status === "PENDING") {
      return Response.json({ error: "Pending payouts cannot be deleted." }, { status: 409 });
    }
    if (existing.status === "COMPLETED" && !isSuperAdmin) {
      return Response.json({ error: "Only the super-admin can delete completed payouts." }, { status: 403 });
    }
    return Response.json({ error: "This payout cannot be deleted." }, { status: 409 });
  }

  await logActivity({
    user: admin._id,
    actorRole: "admin",
    action: "karopay_payout_history_deleted",
    targetUser: payout.user,
    message: `Deleted ${payout.status.toLowerCase()} Karopay payout history ${payout.merchantOrderId}; no additional balance change was made.`,
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
