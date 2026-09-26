import mongoose from "mongoose";
import dbConnect from "../../../../../../../lib/mongodb";
import Payout from "../../../../../../../lib/models/Payout";
import { requireAdmin } from "../../../../../../../lib/auth";
import { queryPayoutOrder, KaropayError } from "../../../../../../../lib/karopay";
import { applyPayoutResult, serializePayout } from "../../../../../../../lib/payouts";

// "Check status" — re-reads the payout from Karopay's Order Inquiry endpoint
// and applies it through the same idempotent path as the notify callback.
// Never re-sends a payout.
export async function POST(request, ctx) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid payout id." }, { status: 400 });

  await dbConnect();
  const payout = await Payout.findById(id);
  if (!payout) return Response.json({ error: "Payout not found." }, { status: 404 });

  try {
    const data = await queryPayoutOrder(payout.merchantOrderId);
    await applyPayoutResult(payout.merchantOrderId, data, { source: "inquiry" });
  } catch (err) {
    if (err instanceof KaropayError) {
      const detail = err.detail && !(err.detail instanceof Error) ? err.detail : {};
      return Response.json(
        { error: `Karopay status check failed: ${err.message}`, karopay: { code: detail.code ?? null, msg: detail.msg ?? null, traceId: detail.traceId ?? null } },
        { status: 502 }
      );
    }
    console.error("[admin/karopay/payout/sync] Unexpected error", err?.message);
    return Response.json({ error: "Could not check this payout's status." }, { status: 500 });
  }

  const fresh = await Payout.findById(id).populate("user", "uid name email");
  return Response.json({ payout: serializePayout(fresh) });
}
