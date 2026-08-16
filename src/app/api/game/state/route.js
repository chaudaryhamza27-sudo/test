import dbConnect from "../../../../lib/mongodb";
import GameBet from "../../../../lib/models/GameBet";
import { getCurrentUser } from "../../../../lib/auth";
import { getActiveRound, getRoundPhase } from "../../../../lib/gameEngine";

export async function GET() {
  await dbConnect();

  const round = await getActiveRound();
  const info = getRoundPhase(round);
  const user = await getCurrentUser();

  let myBets = { 1: null, 2: null };
  if (user) {
    const bets = await GameBet.find({ round: round._id, user: user._id });
    for (const bet of bets) {
      myBets[bet.slot] = {
        amount: bet.amount,
        status: bet.status,
        cashoutMultiplier: bet.cashoutMultiplier,
        autoCashoutTarget: bet.autoCashoutTarget,
        payout: bet.payout,
      };
    }
  }

  const playerCount = await GameBet.countDocuments({ round: round._id });

  return Response.json({
    roundId: round._id,
    playerCount,
    serverSeedHash: round.serverSeedHash,
    // The seed (and therefore the crash point) is only revealed once the round is done.
    serverSeed: info.phase === "DONE" || info.phase === "CRASHED" ? round.serverSeed : undefined,
    crashPoint: info.phase === "DONE" || info.phase === "CRASHED" ? round.crashPoint : undefined,
    phase: info.phase,
    multiplier: info.multiplier,
    waitingEndsAt: info.waitingEndsAt ?? null,
    now: Date.now(),
    balance: user ? user.balance : null,
    myBets,
  });
}
