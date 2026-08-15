import dbConnect from "../../../../lib/mongodb";
import GameBet from "../../../../lib/models/GameBet";
import User from "../../../../lib/models/User";
import GameRound from "../../../../lib/models/GameRound";
import { requireAdmin } from "../../../../lib/auth";

const PAGE_SIZE = 20;

// Real Aviator cashout activity — GameBet docs the player already cashed
// out (status: "cashed_out"). There is no separate admin "cashout" concept
// in this codebase; this is the actual data behind that word.
export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const userQuery = (searchParams.get("user") || "").trim();

  await dbConnect();
  void User; // registers the User schema with mongoose before populate()
  void GameRound; // registers the GameRound schema with mongoose before populate()

  const filter = { status: "cashed_out" };
  if (userQuery) {
    const matchingUsers = await User.find(
      { $or: [{ uid: new RegExp(userQuery, "i") }, { email: new RegExp(userQuery, "i") }] },
      "_id"
    );
    filter.user = { $in: matchingUsers.map((u) => u._id) };
  }

  const [bets, total] = await Promise.all([
    GameBet.find(filter)
      .populate("user", "uid email name")
      .populate("round", "crashPoint")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    GameBet.countDocuments(filter),
  ]);

  return Response.json({
    items: bets.map((b) => ({
      id: b._id,
      user: b.user ? { uid: b.user.uid, email: b.user.email, name: b.user.name } : null,
      amount: b.amount,
      cashoutMultiplier: b.cashoutMultiplier,
      payout: b.payout,
      roundCrashPoint: b.round?.crashPoint ?? null,
      cashedOutAt: b.updatedAt,
    })),
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  });
}
