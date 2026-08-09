import dbConnect from "../../../../lib/mongodb";
import Transaction from "../../../../lib/models/Transaction";
import GameBet from "../../../../lib/models/GameBet";
import { getCurrentUser } from "../../../../lib/auth";

const COMPLETED_STATUSES = ["approved", "completed"];

// Read-only lifetime aggregates — no balance mutation, adjustBalance() is
// never touched here.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();

  const [depositAgg, withdrawAgg, wageredAgg, wonAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: user._id, type: "deposit", status: { $in: COMPLETED_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { user: user._id, type: "withdraw", status: { $in: COMPLETED_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    GameBet.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    GameBet.aggregate([
      { $match: { user: user._id, status: "cashed_out" } },
      { $group: { _id: null, total: { $sum: "$payout" } } },
    ]),
  ]);

  return Response.json({
    totalDeposited: depositAgg[0]?.total ?? 0,
    totalWithdrawn: withdrawAgg[0]?.total ?? 0,
    gameWagered: wageredAgg[0]?.total ?? 0,
    gameWon: wonAgg[0]?.total ?? 0,
  });
}
