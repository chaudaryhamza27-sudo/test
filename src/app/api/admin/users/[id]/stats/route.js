import dbConnect from "../../../../../../lib/mongodb";
import User from "../../../../../../lib/models/User";
import Transaction from "../../../../../../lib/models/Transaction";
import GameBet from "../../../../../../lib/models/GameBet";
import { requireAdmin } from "../../../../../../lib/auth";

const COMPLETED_STATUSES = ["approved", "completed"];

// Real per-user lifetime aggregates for the User Control "Details" view —
// same aggregation shape as /api/wallet/stats (the user's own view of this
// data), just admin-gated and parameterized by an arbitrary userId.
export async function GET(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  await dbConnect();

  const user = await User.findById(id, "-passwordHash");
  if (!user) return Response.json({ error: "User not found." }, { status: 404 });

  const [depositAgg, withdrawAgg, wageredAgg, wonAgg, lostAgg, betCounts] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: user._id, type: "deposit", status: { $in: COMPLETED_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { user: user._id, type: "withdraw", status: { $in: COMPLETED_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    GameBet.aggregate([{ $match: { user: user._id } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    GameBet.aggregate([
      { $match: { user: user._id, status: "cashed_out" } },
      { $group: { _id: null, total: { $sum: "$payout" } } },
    ]),
    GameBet.aggregate([
      { $match: { user: user._id, status: "lost" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    GameBet.aggregate([{ $match: { user: user._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const counts = Object.fromEntries(betCounts.map((c) => [c._id, c.count]));

  return Response.json({
    user: {
      uid: user.uid,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      kycApproved: user.kycApproved,
      trustScore: user.trustScore,
    },
    totalDeposited: depositAgg[0]?.total ?? 0,
    totalWithdrawn: withdrawAgg[0]?.total ?? 0,
    totalWagered: wageredAgg[0]?.total ?? 0,
    totalWon: wonAgg[0]?.total ?? 0,
    totalLost: lostAgg[0]?.total ?? 0,
    betsPlaced: counts.placed || 0,
    betsWon: counts.cashed_out || 0,
    betsLost: counts.lost || 0,
  });
}
