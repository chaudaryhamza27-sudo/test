import "server-only";
import { createHmac } from "node:crypto";
import WingoBet from "./models/WingoBet";
import Transaction from "./models/Transaction";
import { adjustBalance } from "./wallet";
import { logActivity } from "./activity";
import { LOCK_SECONDS, MODES, periodAt, payoutFor, selectionLabel } from "../app/wingo/wingoLogic";

// Server-only Win Go business logic. Both API routes (api/wingo/bet,
// api/wingo/state) go through here, so this is the only place a Win Go bet
// moves a balance or writes a Transaction.

export const MIN_BET = 1;
export const MAX_BET = 100000;

// Settled bets that ended within this window are returned as "fresh" so the
// client can pop the win/lose dialog; older ones (player was away) just show
// up in My history.
const FRESH_MS = 90_000;

const RESULT_SECRET = process.env.WINGO_SECRET || process.env.JWT_SECRET;

// The draw for a period. Keyed with a server secret so it can't be computed
// in the browser ahead of time — a plain hash of the issue number would let
// anyone read the next result from the client bundle.
export function resultFor(mode, issue) {
  if (!RESULT_SECRET) throw new Error("WINGO_SECRET / JWT_SECRET is not set.");
  const digest = createHmac("sha256", RESULT_SECRET).update(`${mode}:${issue}`).digest();
  return digest.readUInt32BE(0) % 10;
}

export const modeOrNull = (key) => MODES.find((m) => m.key === key) || null;

// Past `count` completed periods for a mode, newest first. Never includes
// the period still running.
export function recentResults(mode, now, count, offset = 0) {
  const current = Math.floor(now / mode.ms) * mode.ms;
  return Array.from({ length: count }, (_, i) => {
    const { issue } = periodAt(mode, current - (offset + i + 1) * mode.ms);
    return { issue, number: resultFor(mode.key, issue) };
  });
}

function parseSelection(sel) {
  if (!sel || typeof sel !== "object") return null;
  if (sel.kind === "color" && ["green", "red", "violet"].includes(sel.value)) return { kind: "color", value: sel.value };
  if (sel.kind === "size" && ["big", "small"].includes(sel.value)) return { kind: "size", value: sel.value };
  if (sel.kind === "number" && Number.isInteger(sel.value) && sel.value >= 0 && sel.value <= 9) return { kind: "number", value: sel.value };
  return null;
}

// Returns { ok:true, balance, bet } or { error, status }.
export async function placeWingoBet({ userId, modeKey, issue, selection, amount }) {
  const mode = modeOrNull(modeKey);
  if (!mode) return { error: "Unknown game mode.", status: 400 };

  const sel = parseSelection(selection);
  if (!sel) return { error: "Invalid selection.", status: 400 };

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_BET || parsedAmount > MAX_BET) {
    return { error: `Bet amount must be between ${MIN_BET} and ${MAX_BET}.`, status: 400 };
  }

  // The server's clock decides the period, never the client's.
  const now = Date.now();
  const period = periodAt(mode, now);
  if (issue && issue !== period.issue) {
    return { error: "That period has ended — place your bet on the new one.", status: 409 };
  }
  if (period.endsAt - now <= LOCK_SECONDS * 1000) {
    return { error: "Betting is closed for this period — wait for the next one.", status: 409 };
  }

  const updatedUser = await adjustBalance(userId, -parsedAmount);
  if (!updatedUser) return { error: "Insufficient balance.", status: 400 };

  let bet;
  try {
    bet = await WingoBet.create({
      user: userId,
      mode: mode.key,
      issue: period.issue,
      endsAt: new Date(period.endsAt),
      selection: sel,
      amount: parsedAmount,
    });
  } catch {
    await adjustBalance(userId, parsedAmount);
    return { error: "Could not place the bet, please try again.", status: 500 };
  }

  await Transaction.create({
    user: userId,
    type: "game_bet",
    amount: parsedAmount,
    status: "completed",
    meta: { game: "wingo", mode: mode.key, issue: period.issue, betId: bet._id },
  });

  await logActivity({
    user: userId,
    actorRole: "user",
    action: "wingo_bet_placed",
    message: `Placed a Rs${parsedAmount.toLocaleString()} bet on ${selectionLabel(sel)} in ${mode.label}.`,
    meta: { amount: parsedAmount, mode: mode.key, issue: period.issue },
  });

  return { ok: true, balance: updatedUser.balance, bet: serializeBet(bet) };
}

// Settles every one of this user's bets whose period has ended. Each bet is
// claimed with a pending→won/lost compare-and-set before any credit, so two
// overlapping syncs can never pay the same bet twice.
export async function settleDueBets(userId) {
  const now = Date.now();
  const due = await WingoBet.find({ user: userId, status: "pending", endsAt: { $lte: new Date(now) } }).limit(200);

  const fresh = [];
  for (const b of due) {
    const number = resultFor(b.mode, b.issue);
    const payout = payoutFor(b.selection, b.amount, number);
    const claimed = await WingoBet.findOneAndUpdate(
      { _id: b._id, status: "pending" },
      { $set: { status: payout > 0 ? "won" : "lost", number, payout } },
      { new: true }
    );
    if (!claimed) continue;

    if (payout > 0) {
      await adjustBalance(userId, payout);
      await Transaction.create({
        user: userId,
        type: "game_win",
        amount: payout,
        status: "completed",
        meta: { game: "wingo", mode: b.mode, issue: b.issue, betId: b._id, number },
      });
      await logActivity({
        user: userId,
        actorRole: "user",
        action: "wingo_win",
        message: `Won Rs${payout.toLocaleString()} on ${modeOrNull(b.mode)?.label ?? "Win Go"} period ${b.issue}.`,
        meta: { payout, mode: b.mode, issue: b.issue, number },
      });
    }
    if (now - b.endsAt.getTime() <= FRESH_MS) fresh.push(serializeBet(claimed));
  }
  return fresh;
}

export async function recentBets(userId, modeKey, limit = 50) {
  const bets = await WingoBet.find({ user: userId, mode: modeKey }).sort({ createdAt: -1 }).limit(limit);
  return bets.map(serializeBet);
}

function serializeBet(b) {
  return {
    id: String(b._id),
    mode: b.mode,
    issue: b.issue,
    endsAt: b.endsAt.getTime(),
    selection: { kind: b.selection.kind, value: b.selection.value },
    amount: b.amount,
    status: b.status,
    number: b.number,
    payout: b.payout,
    placedAt: b.createdAt.getTime(),
  };
}
