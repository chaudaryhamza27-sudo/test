import dbConnect from "../../../lib/mongodb";
import Transaction from "../../../lib/models/Transaction";
import { getCurrentUser } from "../../../lib/auth";
import { adjustBalance } from "../../../lib/wallet";
import { logActivity } from "../../../lib/activity";

const MIN_WITHDRAW = 500;

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

  const body = await request.json();
  const { amount, method, accountNumber } = body || {};
  const parsedAmount = Number(amount);

  if (!parsedAmount || parsedAmount < MIN_WITHDRAW) {
    return Response.json({ error: `Minimum withdraw is Rs ${MIN_WITHDRAW}.` }, { status: 400 });
  }
  if (!method || !accountNumber) {
    return Response.json({ error: "Payment method and account number are required." }, { status: 400 });
  }

  await dbConnect();

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
  });

  await logActivity({
    user: user._id,
    actorRole: "user",
    action: "withdraw_requested",
    message: `Requested a demo withdrawal of Rs${parsedAmount.toLocaleString()}.`,
    meta: { transactionId: withdrawal._id, amount: parsedAmount },
  });

  return Response.json({ withdrawal, balance: updatedUser.balance });
}
