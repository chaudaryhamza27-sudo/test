import dbConnect from "../../../../lib/mongodb";
import GameBet from "../../../../lib/models/GameBet";

// Public, real recent-activity feed (no auth required — spectators can watch
// the game without logging in). Only exposes each bettor's `uid`, never their
// name/email/phone, since this is visible to every visitor.
export async function GET() {
  await dbConnect();

  const bets = await GameBet.find({ status: { $ne: "placed" } })
    .populate("user", "uid")
    .populate("round", "crashPoint")
    .sort({ createdAt: -1 })
    .limit(30);

  const items = bets.map((bet) => ({
    id: bet._id,
    uid: bet.user?.uid || null,
    roundId: bet.round?._id || null,
    crashPoint: bet.round?.crashPoint ?? null,
    amount: bet.amount,
    status: bet.status,
    cashoutMultiplier: bet.cashoutMultiplier,
    payout: bet.payout,
    createdAt: bet.createdAt,
  }));

  return Response.json({ items });
}
