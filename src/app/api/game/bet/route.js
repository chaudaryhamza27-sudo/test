import dbConnect from "../../../../lib/mongodb";
import GameBet from "../../../../lib/models/GameBet";
import Transaction from "../../../../lib/models/Transaction";
import { getCurrentUser } from "../../../../lib/auth";
import { getActiveRound, getRoundPhase } from "../../../../lib/gameEngine";
import { adjustBalance } from "../../../../lib/wallet";
import { logActivity } from "../../../../lib/activity";

const MIN_BET = 10;
const MAX_BET = 100000;

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const amount = Number(body?.amount);

  if (!Number.isFinite(amount) || amount < MIN_BET || amount > MAX_BET) {
    return Response.json({ error: `Bet amount must be between ${MIN_BET} and ${MAX_BET}.` }, { status: 400 });
  }

  await dbConnect();

  const round = await getActiveRound();
  const info = getRoundPhase(round);
  if (info.phase !== "WAITING") {
    return Response.json({ error: "Betting is closed for this round — wait for the next one." }, { status: 409 });
  }

  const existing = await GameBet.findOne({ round: round._id, user: user._id });
  if (existing) {
    return Response.json({ error: "You already placed a bet on this round." }, { status: 409 });
  }

  const updatedUser = await adjustBalance(user._id, -amount);
  if (!updatedUser) {
    return Response.json({ error: "Insufficient balance." }, { status: 400 });
  }

  let bet;
  try {
    bet = await GameBet.create({ round: round._id, user: user._id, amount, status: "placed" });
  } catch (err) {
    // Unique index race — someone placed a bet on this round in the same instant. Refund and reject.
    await adjustBalance(user._id, amount);
    return Response.json({ error: "You already placed a bet on this round." }, { status: 409 });
  }

  await Transaction.create({
    user: user._id,
    type: "game_bet",
    amount,
    status: "completed",
    meta: { roundId: round._id, betId: bet._id },
  });

  await logActivity({
    user: user._id,
    actorRole: "user",
    action: "game_bet_placed",
    message: `Placed a Rs${amount.toLocaleString()} bet on the Aviator round.`,
    meta: { roundId: round._id, amount },
  });

  return Response.json({ ok: true, balance: updatedUser.balance, roundId: round._id, amount });
}
