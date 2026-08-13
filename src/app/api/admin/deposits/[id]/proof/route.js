import dbConnect from "../../../../../../lib/mongodb";
import Transaction from "../../../../../../lib/models/Transaction";
import { requireAdmin } from "../../../../../../lib/auth";

// Serves the proof-of-payment image/PDF for one deposit, admin-only — kept
// out of the list endpoint since these can be multi-MB each.
export async function GET(request, ctx) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  await dbConnect();
  const tx = await Transaction.findOne({ _id: id, type: "deposit" }, "meta");
  if (!tx || !tx.meta?.proofImage) {
    return Response.json({ error: "No payment proof on file for this deposit." }, { status: 404 });
  }

  return Response.json({ proofImage: tx.meta.proofImage });
}
