import dbConnect from "../../../../lib/mongodb";
import GameRound from "../../../../lib/models/GameRound";
import GameBet from "../../../../lib/models/GameBet";
import { requireAdmin } from "../../../../lib/auth";
import { getRoundPhase } from "../../../../lib/gameEngine";

const PAGE_SIZE = 20;

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  await dbConnect();

  const [rounds, total] = await Promise.all([
    GameRound.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    GameRound.countDocuments({}),
  ]);

  const counts = await GameBet.aggregate([
    { $match: { round: { $in: rounds.map((r) => r._id) } } },
    { $group: { _id: "$round", bets: { $sum: 1 }, wagered: { $sum: "$amount" }, paidOut: { $sum: "$payout" } } },
  ]);
  const countsByRound = Object.fromEntries(counts.map((c) => [String(c._id), c]));

  return Response.json({
    items: rounds.map((r) => {
      const info = getRoundPhase(r);
      const stats = countsByRound[String(r._id)];
      return {
        id: r._id,
        crashPoint: r.crashPoint,
        phase: info.phase,
        createdAt: r.createdAt,
        bets: stats?.bets || 0,
        wagered: stats?.wagered || 0,
        paidOut: stats?.paidOut || 0,
      };
    }),
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  });
}
