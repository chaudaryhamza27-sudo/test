import dbConnect from "../../../../lib/mongodb";
import GameBet from "../../../../lib/models/GameBet";

// Public, real leaderboard of the biggest cash-outs. Same privacy treatment
// as /api/game/all-bets — only `uid` is exposed, never name/email/phone.
export async function GET() {
  await dbConnect();

  const bets = await GameBet.find({ status: "cashed_out" })
    .populate("user", "uid")
    .populate("round", "crashPoint")
    .sort({ payout: -1 })
    .limit(20);

  const items = bets.map((bet) => ({
    id: bet._id,
    uid: bet.user?.uid || null,
    roundId: bet.round?._id || null,
    amount: bet.amount,
    cashoutMultiplier: bet.cashoutMultiplier,
    payout: bet.payout,
    createdAt: bet.createdAt,
  }));

  return Response.json({ items });
}
