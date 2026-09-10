import GameBet from "./models/GameBet";
import Transaction from "./models/Transaction";
import { getActiveRound, getRoundPhase } from "./gameEngine";
import { adjustBalance } from "./wallet";
import { logActivity } from "./activity";

// Shared, transport-agnostic game business logic. Both the REST routes
// (src/app/api/game/bet, /cashout — kept as a fallback path when the
// realtime-server isn't reachable) and the Socket.IO realtime server call
// these same functions, so there is exactly one place that ever creates a
// GameBet, moves a balance, or writes a Transaction for betting activity.

export const MIN_BET = 10;
export const MAX_BET = 100000;

// Returns { ok:true, balance, roundId, amount, slot } or { error, status }.
// `slot` is 1 or 2 — two independent bet panels per user per round (one can
// be a manual bet, the other an auto-repeating bet, or any combination).
export async function placeBet({ userId, amount, autoCashoutTarget = null, slot = 1 }) {
  const parsedSlot = slot === 2 ? 2 : 1;
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_BET || parsedAmount > MAX_BET) {
    return { error: `Bet amount must be between ${MIN_BET} and ${MAX_BET}.`, status: 400 };
  }

  let parsedAuto = null;
  if (autoCashoutTarget !== null && autoCashoutTarget !== undefined && autoCashoutTarget !== "") {
    const n = Number(autoCashoutTarget);
    if (Number.isFinite(n) && n >= 1) parsedAuto = Math.round(n * 100) / 100;
  }

  const round = await getActiveRound();
  const info = getRoundPhase(round);
  if (info.phase !== "WAITING") {
    return { error: "Betting is closed for this round — wait for the next one.", status: 409 };
  }

  const existing = await GameBet.findOne({ round: round._id, user: userId, slot: parsedSlot });
  if (existing) {
    return { error: "You already placed a bet on this round.", status: 409 };
  }

  const updatedUser = await adjustBalance(userId, -parsedAmount);
  if (!updatedUser) {
    return { error: "Insufficient balance.", status: 400 };
  }

  let bet;
  try {
    bet = await GameBet.create({
      round: round._id,
      user: userId,
      slot: parsedSlot,
      amount: parsedAmount,
      status: "placed",
      autoCashoutTarget: parsedAuto,
    });
  } catch {
    // Unique index race — someone placed a bet on this round/slot in the same instant. Refund and reject.
    await adjustBalance(userId, parsedAmount);
    return { error: "You already placed a bet on this round.", status: 409 };
  }

  await Transaction.create({
    user: userId,
    type: "game_bet",
    amount: parsedAmount,
    status: "completed",
    meta: { roundId: round._id, betId: bet._id },
  });

  await logActivity({
    user: userId,
    actorRole: "user",
    action: "game_bet_placed",
    message: `Placed a Rs${parsedAmount.toLocaleString()} bet on the Aviator round.`,
    meta: { roundId: round._id, amount: parsedAmount },
  });

  return { ok: true, balance: updatedUser.balance, roundId: round._id, amount: parsedAmount, slot: parsedSlot };
}

// Cashes out the caller's own bet (in the given slot) on the currently
// active round (used by the manual "Cash out" click, over REST or a socket event).
// Returns { ok:true, multiplier, payout, balance, slot } or { error, status }.
export async function cashOutBet({ userId, slot = 1 }) {
  const parsedSlot = slot === 2 ? 2 : 1;
  const round = await getActiveRound();
  const info = getRoundPhase(round);
  if (info.phase !== "RUNNING") {
    return { error: "You can only cash out while the round is running.", status: 409 };
  }

  const result = await claimAndCashOut({ roundId: round._id, userId, multiplier: info.multiplier, slot: parsedSlot });
  if (!result) {
    return { error: "No active bet to cash out.", status: 409 };
  }
  return { ok: true, ...result };
}

// Atomically claims a specific placed bet (round+user+slot) and cashes it
// out at `multiplier`. Shared by cashOutBet() (self-initiated) and the
// realtime server's auto-cash-out sweep (server-initiated once a player's
// target is reached).
// Returns { multiplier, payout, balance, userId, slot } or null if there was
// nothing to claim (already resolved, or raced by another request).
export async function claimAndCashOut({ roundId, userId, multiplier, slot = 1 }) {
  const parsedSlot = slot === 2 ? 2 : 1;
  const bet = await GameBet.findOneAndUpdate(
    { round: roundId, user: userId, slot: parsedSlot, status: "placed" },
    { $set: { status: "cashed_out", cashoutMultiplier: multiplier } },
    { new: false }
  );
  if (!bet) return null;

  const payout = Math.round(bet.amount * multiplier * 100) / 100;
  await GameBet.updateOne({ _id: bet._id }, { $set: { payout } });

  const updatedUser = await adjustBalance(userId, payout);

  await Transaction.create({
    user: userId,
    type: "game_win",
    amount: payout,
    status: "completed",
    meta: { roundId, betId: bet._id, multiplier },
  });

  await logActivity({
    user: userId,
    actorRole: "user",
    action: "game_cashout",
    message: `Cashed out at ${multiplier.toFixed(2)}x for Rs${payout.toLocaleString()}.`,
    meta: { roundId, multiplier, payout },
  });

  return { multiplier, payout, balance: updatedUser?.balance ?? null, userId, slot: parsedSlot };
}

// Called every game-loop tick by the realtime server (RUNNING phase only).
// Finds every still-placed bet on this round whose auto-cash-out target has
// been reached or passed, and cashes each one out server-side — the target
// is enforced here, not trusted from the client. REST-only clients simply
// never set autoCashoutTarget, so they're unaffected. Runs across both slots.
export async function sweepAutoCashouts({ roundId, multiplier }) {
  const eligible = await GameBet.find({
    round: roundId,
    status: "placed",
    autoCashoutTarget: { $ne: null, $lte: multiplier },
  });

  const results = await Promise.all(
    eligible.map((bet) => claimAndCashOut({ roundId, userId: bet.user, multiplier: bet.autoCashoutTarget, slot: bet.slot }))
  );
  return results.filter(Boolean);
}
