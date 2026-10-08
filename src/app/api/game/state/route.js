import dbConnect from "../../../../lib/mongodb";
import GameBet from "../../../../lib/models/GameBet";
import { getCurrentUser } from "../../../../lib/auth";
import { getActiveRound, getRoundPhase } from "../../../../lib/gameEngine";

// Every player polls this route, so share the round lookups across them.
// A round's phase is computed purely from its immutable createdAt/crashPoint,
// and getActiveRound() only ever moves to a new round once the current one is
// DONE — so reusing a not-yet-DONE round returns exactly what a fresh lookup would.
let cachedRound = null;
async function currentRound() {
  if (cachedRound && getRoundPhase(cachedRound).phase !== "DONE") return cachedRound;
  cachedRound = await getActiveRound();
  return cachedRound;
}

// Bet count shown as "players this round" — refreshed at most once a second.
const PLAYER_COUNT_TTL_MS = 1000;
let cachedCount = { roundId: null, value: 0, at: 0 };
async function roundPlayerCount(roundId) {
  const now = Date.now();
  if (cachedCount.roundId !== String(roundId) || now - cachedCount.at >= PLAYER_COUNT_TTL_MS) {
    const value = await GameBet.countDocuments({ round: roundId });
    cachedCount = { roundId: String(roundId), value, at: now };
  }
  return cachedCount.value;
}

export async function GET() {
  await dbConnect();

  const round = await currentRound();
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

  const playerCount = await roundPlayerCount(round._id);

  return Response.json(
    {
      roundId: round._id,
      playerCount,
      serverSeedHash: round.serverSeedHash,
      // The seed (and therefore the crash point) is only revealed once the round is done.
      serverSeed: info.phase === "DONE" || info.phase === "CRASHED" ? round.serverSeed : undefined,
      crashPoint: info.phase === "DONE" || info.phase === "CRASHED" ? round.crashPoint : undefined,
      phase: info.phase,
      multiplier: info.multiplier,
      waitingEndsAt: info.waitingEndsAt ?? null,
      startedAt: info.startedAt ?? null,
      now: Date.now(),
      balance: user ? user.balance : null,
      myBets,
    },
    // Public read-only state; no credentials are read from a cross-origin caller.
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
