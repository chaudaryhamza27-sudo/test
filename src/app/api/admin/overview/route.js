import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import Transaction from "../../../../lib/models/Transaction";
import GameRound from "../../../../lib/models/GameRound";
import Payment from "../../../../lib/models/Payment";
import Payout from "../../../../lib/models/Payout";
import { queryMerchantBalance } from "../../../../lib/karopay";
import { requireAdmin } from "../../../../lib/auth";

const DAYS = 14;
const SETTLED_TRANSACTION_STATUSES = ["approved", "completed"];

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  await dbConnect();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    totalTransactions,
    totalGameRounds,
    pendingDeposits,
    pendingWithdrawals,
    approvedDepositAgg,
    approvedWithdrawAgg,
    usersSince,
    depositsSince,
    karopayDepositAgg,
    karopayPendingDeposits,
    payoutAgg,
    gatewayBalance,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isBanned: false }),
    User.countDocuments({ isBanned: true }),
    Transaction.countDocuments({}),
    GameRound.countDocuments({}),
    Transaction.countDocuments({ type: "deposit", status: "pending" }),
    Transaction.countDocuments({ type: "withdraw", status: "pending" }),
    Transaction.aggregate([
      { $match: { type: "deposit", status: { $in: SETTLED_TRANSACTION_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { type: "withdraw", status: { $in: SETTLED_TRANSACTION_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    User.find({ createdAt: { $gte: since } }, "createdAt"),
    Transaction.find(
      { type: "deposit", status: { $in: SETTLED_TRANSACTION_STATUSES }, createdAt: { $gte: since } },
      "createdAt amount"
    ),
    // Karopay deposits (Payment.amount is in paisa).
    Payment.aggregate([
      { $match: { provider: "karopay", status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Payment.countDocuments({ provider: "karopay", status: "PENDING" }),
    // Karopay Cash Out payouts, grouped by status (Payout.amount is in paisa).
    Payout.aggregate([{ $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    queryMerchantBalance().catch(() => null),
  ]);

  const payoutsBy = Object.fromEntries(payoutAgg.map((p) => [p._id, p]));

  const days = lastNDays(DAYS);
  const registrationsByDay = Object.fromEntries(days.map((d) => [d, 0]));
  usersSince.forEach((u) => {
    const k = dayKey(u.createdAt);
    if (k in registrationsByDay) registrationsByDay[k] += 1;
  });

  const depositsByDay = Object.fromEntries(days.map((d) => [d, 0]));
  depositsSince.forEach((t) => {
    const k = dayKey(t.createdAt);
    if (k in depositsByDay) depositsByDay[k] += t.amount;
  });

  return Response.json({
    totalUsers,
    activeUsers,
    bannedUsers,
    totalTransactions,
    totalGameRounds,
    pendingDeposits,
    pendingWithdrawals,
    totalDeposits: approvedDepositAgg[0]?.total || 0,
    totalWithdrawals: approvedWithdrawAgg[0]?.total || 0,
    karopay: {
      depositsTotal: (karopayDepositAgg[0]?.total || 0) / 100,
      depositsCount: karopayDepositAgg[0]?.count || 0,
      pendingDeposits: karopayPendingDeposits,
      cashOutTotal: (payoutsBy.COMPLETED?.total || 0) / 100,
      cashOutCount: payoutsBy.COMPLETED?.count || 0,
      pendingCashOuts: payoutsBy.PENDING?.count || 0,
      failedCashOuts: payoutsBy.FAILED?.count || 0,
      gatewayBalance: gatewayBalance ? gatewayBalance.balanceCents / 100 : null,
      gatewayFrozen: gatewayBalance ? gatewayBalance.freezeBalanceCents / 100 : null,
    },
    registrationsByDay: days.map((d) => ({ date: d, count: registrationsByDay[d] })),
    depositsByDay: days.map((d) => ({ date: d, amount: depositsByDay[d] })),
  });
}
