import dbConnect from "../../../../lib/mongodb";
import Transaction from "../../../../lib/models/Transaction";
import { getCurrentUser } from "../../../../lib/auth";

const DEPOSIT_STATUSES = ["approved", "completed"];

// Real VIP tier computed from lifetime completed deposits — not a hardcoded badge.
const TIERS = [
  { name: "Member", min: 0 },
  { name: "VIP", min: 300 },
  { name: "Gold", min: 3000 },
  { name: "Platinum", min: 17000 },
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();

  const agg = await Transaction.aggregate([
    { $match: { user: user._id, type: "deposit", status: { $in: DEPOSIT_STATUSES } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const lifetimeDeposit = agg[0]?.total ?? 0;

  let tierIndex = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (lifetimeDeposit >= TIERS[i].min) tierIndex = i;
  }
  const tier = TIERS[tierIndex];
  const next = TIERS[tierIndex + 1] ?? null;

  return Response.json({
    lifetimeDeposit,
    tier: tier.name,
    nextTier: next?.name ?? null,
    amountToNextTier: next ? next.min - lifetimeDeposit : 0,
  });
}
