import crypto from "crypto";
import GameRound from "./models/GameRound";
import GameBet from "./models/GameBet";
import GameEngineState from "./models/GameEngineState";

// --- Timing ---------------------------------------------------------------
export const WAITING_MS = 6000; // betting window before a round starts climbing
export const RESULT_MS = 4000; // how long the crashed result stays visible
const GROWTH_PER_SEC = 0.085; // multiplier = e^(GROWTH_PER_SEC * secondsElapsed)

// --- Provably-fair crash point ---------------------------------------------
// Server commits to a seed hash before the round starts (serverSeedHash is
// shown to the client immediately); the raw seed is only revealed once the
// round resolves, so the crash point can't be predicted or influenced by
// clients, but can be independently verified afterwards.
export function generateServerSeed() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSeed(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

// Returns the crash point in basis points of the multiplier (100 == 1.00x).
export function crashPointFromSeed(seed) {
  const hash = hashSeed(seed);
  const seedInt = parseInt(hash.slice(0, 13), 16); // 52-bit int
  const MAX = Math.pow(2, 52);
  const HOUSE_EDGE = 0.04; // 4% of rounds effectively resolve in the house's favor

  if (seedInt % 25 === 0) return 100; // ~4% of rounds crash instantly at 1.00x

  const point = Math.floor(((100 - HOUSE_EDGE * 100) * MAX) / (MAX - seedInt));
  return Math.min(Math.max(point, 100), 200000); // clamp to [1.00x, 2000x]
}

// --- Multiplier curve --------------------------------------------------
export function multiplierAtElapsedMs(elapsedMs) {
  const t = Math.max(0, elapsedMs) / 1000;
  return Math.exp(GROWTH_PER_SEC * t);
}

function elapsedMsForMultiplier(multiplier) {
  return (Math.log(multiplier) / GROWTH_PER_SEC) * 1000;
}

// --- Round phase derivation ----------------------------------------------
// Purely a function of wall-clock time, so it works the same across
// serverless instances without a persistent background timer.
export function getRoundPhase(round, now = Date.now()) {
  const createdAt = new Date(round.createdAt).getTime();
  const waitingEndsAt = createdAt + WAITING_MS;
  const crashMultiplier = round.crashPoint / 100;

  if (now < waitingEndsAt) {
    return { phase: "WAITING", multiplier: 1, waitingEndsAt, msLeft: waitingEndsAt - now };
  }

  const elapsed = now - waitingEndsAt;
  const crashElapsedMs = elapsedMsForMultiplier(crashMultiplier);

  if (elapsed < crashElapsedMs) {
    return {
      phase: "RUNNING",
      multiplier: multiplierAtElapsedMs(elapsed),
      waitingEndsAt,
      startedAt: waitingEndsAt,
    };
  }

  const crashedAt = waitingEndsAt + crashElapsedMs;
  if (now < crashedAt + RESULT_MS) {
    return { phase: "CRASHED", multiplier: crashMultiplier, crashedAt };
  }

  return { phase: "DONE", multiplier: crashMultiplier, crashedAt };
}

async function createRound() {
  const serverSeed = generateServerSeed();
  return GameRound.create({
    serverSeed,
    serverSeedHash: hashSeed(serverSeed),
    crashPoint: crashPointFromSeed(serverSeed),
  });
}

// Returns the currently active round, advancing to a freshly created one if
// the previous round has finished displaying its result. Uses an optimistic
// compare-and-swap on the singleton pointer doc so concurrent requests can't
// create duplicate "current" rounds.
export async function getActiveRound() {
  let state = await GameEngineState.findById("main");
  let round = state?.currentRoundId ? await GameRound.findById(state.currentRoundId) : null;

  if (!round) {
    round = await createRound();
    state = await GameEngineState.findOneAndUpdate(
      { _id: "main", currentRoundId: state?.currentRoundId ?? null },
      { $set: { currentRoundId: round._id } },
      { upsert: true, new: true }
    );
    if (!state.currentRoundId.equals(round._id)) {
      await GameRound.deleteOne({ _id: round._id }).catch(() => {});
      round = await GameRound.findById(state.currentRoundId);
    }
    return round;
  }

  const info = getRoundPhase(round);
  if (info.phase !== "DONE") return round;

  const newRound = await createRound();
  const swapped = await GameEngineState.findOneAndUpdate(
    { _id: "main", currentRoundId: round._id },
    { $set: { currentRoundId: newRound._id } },
    { new: true }
  );

  if (swapped && swapped.currentRoundId.equals(newRound._id)) {
    await settleRound(round._id);
    return newRound;
  }

  await GameRound.deleteOne({ _id: newRound._id }).catch(() => {});
  return GameRound.findById(swapped.currentRoundId);
}

// Marks any bets that were never cashed out before the round crashed as lost.
export async function settleRound(roundId) {
  await GameBet.updateMany({ round: roundId, status: "placed" }, { $set: { status: "lost" } });
}
