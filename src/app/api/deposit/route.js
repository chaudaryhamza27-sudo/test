import dbConnect from "../../../lib/mongodb";
import Transaction from "../../../lib/models/Transaction";
import { getCurrentUser } from "../../../lib/auth";
import { logActivity } from "../../../lib/activity";

const MIN_DEPOSIT = 3000;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();
  const deposits = await Transaction.find({ user: user._id, type: "deposit" }).sort({ createdAt: -1 });
  return Response.json({ deposits });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json();
  const { amount, method, accountNumber } = body || {};
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_DEPOSIT) {
    return Response.json({ error: `Minimum deposit is Rs ${MIN_DEPOSIT}.` }, { status: 400 });
  }
  if (!method) {
    return Response.json({ error: "Payment method is required." }, { status: 400 });
  }

  await dbConnect();
  const deposit = await Transaction.create({
    user: user._id,
    type: "deposit",
    amount: parsedAmount,
    method,
    accountNumber: accountNumber || "",
    status: "pending",
  });

  await logActivity({
    user: user._id,
    actorRole: "user",
    action: "deposit_requested",
    message: `Requested a demo deposit of Rs${parsedAmount.toLocaleString()}.`,
    meta: { transactionId: deposit._id, amount: parsedAmount },
  });

  return Response.json({ deposit });
}
