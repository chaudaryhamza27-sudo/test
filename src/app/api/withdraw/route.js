import dbConnect from "../../../lib/mongodb";
import Transaction from "../../../lib/models/Transaction";
import { getCurrentUser } from "../../../lib/auth";
import { adjustBalance, getWithdrawEligibility } from "../../../lib/wallet";
import { logActivity } from "../../../lib/activity";
import { sendTelegramMessage } from "../../../lib/telegram";

const ELIGIBILITY_MESSAGES = {
  pending_deposit: "Your deposit is still pending verification. You can withdraw once it's approved.",
  no_deposit: "Withdrawal is available after your first deposit is verified. Please make a deposit first.",
};
const TRUST_SCORE_BLOCK_MESSAGE = "Email Not Authorized";

const MIN_WITHDRAW = 500;
// Every withdrawal already sits at status:"pending" until an admin approves
// it — this just flags the larger ones in meta so the admin table can call
// them out for a closer look, instead of pretending there's a separate gate.
const LARGE_WITHDRAW_THRESHOLD = 20000;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();
  const withdrawals = await Transaction.find({ user: user._id, type: "withdraw" }).sort({ createdAt: -1 });
  return Response.json({ withdrawals });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });
  if (user.isBanned) {
    return Response.json({ error: "You've been banned from withdrawing. Please contact support for help.", banned: true }, { status: 403 });
  }

  const body = await request.json();
  const { amount, method, accountNumber } = body || {};
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_WITHDRAW) {
    return Response.json({ error: `Minimum withdraw is Rs ${MIN_WITHDRAW}.` }, { status: 400 });
  }
  if (!method || !accountNumber) {
    return Response.json({ error: "Payment method and account number are required." }, { status: 400 });
  }

  await dbConnect();

  if ((user.trustScore ?? 50) === 100) {
    return Response.json({ error: TRUST_SCORE_BLOCK_MESSAGE, trustScoreBlocked: true }, { status: 403 });
  }

  const eligibility = await getWithdrawEligibility(user._id);
  if (!eligibility.eligible) {
    return Response.json({ error: ELIGIBILITY_MESSAGES[eligibility.reason] }, { status: 403 });
  }

  // Hold the funds immediately via an atomic, balance-guarded decrement so that
  // two concurrent withdraw requests can't both succeed against the same balance.
  const updatedUser = await adjustBalance(user._id, -parsedAmount);
  if (!updatedUser) {
    return Response.json({ error: "Insufficient balance." }, { status: 400 });
  }

  const withdrawal = await Transaction.create({
    user: user._id,
    type: "withdraw",
    amount: parsedAmount,
    method,
    accountNumber,
    status: "pending",
    meta: parsedAmount >= LARGE_WITHDRAW_THRESHOLD ? { highValue: true } : null,
  });

  await logActivity({
    user: user._id,
    actorRole: "user",
    action: "withdraw_requested",
    message: `Requested a virtual withdrawal of Rs${parsedAmount.toLocaleString()}.`,
    meta: { transactionId: withdrawal._id, amount: parsedAmount },
  });

  sendTelegramMessage(
    `🏧 <b>New Withdraw Request</b>\nUser: ${user.name || user.uid} (${user.uid})\nAmount: Rs${parsedAmount.toLocaleString()}\nMethod: ${method}\nAccount: ${accountNumber}`
  );

  return Response.json({ withdrawal, balance: updatedUser.balance });
}
