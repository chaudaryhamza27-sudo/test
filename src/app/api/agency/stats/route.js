import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import Transaction from "../../../../lib/models/Transaction";
import { getCurrentUser } from "../../../../lib/auth";

const DEPOSIT_STATUSES = ["approved", "completed"];

// Single-level referral stats — no multi-level MLM tree. "range" filters by
// when the referred user's deposits happened (not by when they signed up).
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") === "month" ? "month" : "all";

  await dbConnect();

  const referredUsers = await User.find({ referredBy: user.inviteCode }, "_id");
  const referredIds = referredUsers.map((u) => u._id);

  const dateFilter = {};
  if (range === "month") {
    const now = new Date();
    dateFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  }

  if (referredIds.length === 0) {
    return Response.json({ range, referrals: 0, depositedReferrals: 0, depositCount: 0, depositAmount: 0 });
  }

  const depositFilter = {
    user: { $in: referredIds },
    type: "deposit",
    status: { $in: DEPOSIT_STATUSES },
    ...dateFilter,
  };

  const [depositedUserIds, agg] = await Promise.all([
    Transaction.distinct("user", depositFilter),
    Transaction.aggregate([
      { $match: depositFilter },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ]),
  ]);

  return Response.json({
    range,
    referrals: referredIds.length,
    depositedReferrals: depositedUserIds.length,
    depositCount: agg[0]?.count ?? 0,
    depositAmount: agg[0]?.total ?? 0,
  });
}
