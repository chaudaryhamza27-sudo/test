import dbConnect from "../../../../lib/mongodb";
import GameBet from "../../../../lib/models/GameBet";
import Transaction from "../../../../lib/models/Transaction";
import { getCurrentUser } from "../../../../lib/auth";
import { getActiveRound, getRoundPhase } from "../../../../lib/gameEngine";
import { adjustBalance } from "../../../../lib/wallet";
import { logActivity } from "../../../../lib/activity";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();

  const round = await getActiveRound();
  const info = getRoundPhase(round);
  if (info.phase !== "RUNNING") {
    return Response.json({ error: "You can only cash out while the round is running." }, { status: 409 });
  }

  // Atomically claim the bet so a duplicate/racing cashout request can't pay out twice.
  const bet = await GameBet.findOneAndUpdate(
    { round: round._id, user: user._id, status: "placed" },
    { $set: { status: "cashed_out", cashoutMultiplier: info.multiplier } },
    { new: false }
  );
  if (!bet) {
    return Response.json({ error: "No active bet to cash out." }, { status: 409 });
  }

  const payout = Math.round(bet.amount * info.multiplier * 100) / 100;
  await GameBet.updateOne({ _id: bet._id }, { $set: { payout } });

  const updatedUser = await adjustBalance(user._id, payout);

  await Transaction.create({
    user: user._id,
    type: "game_win",
    amount: payout,
    status: "completed",
    meta: { roundId: round._id, betId: bet._id, multiplier: info.multiplier },
  });

  await logActivity({
    user: user._id,
    actorRole: "user",
    action: "game_cashout",
    message: `Cashed out at ${info.multiplier.toFixed(2)}x for Rs${payout.toLocaleString()}.`,
    meta: { roundId: round._id, multiplier: info.multiplier, payout },
  });

  return Response.json({ ok: true, multiplier: info.multiplier, payout, balance: updatedUser.balance });
}
