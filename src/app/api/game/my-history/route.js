import dbConnect from "../../../../lib/mongodb";
import GameBet from "../../../../lib/models/GameBet";
import { getCurrentUser } from "../../../../lib/auth";

const PAGE_SIZE = 15;

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  await dbConnect();

  const filter = { user: user._id };

  const [bets, total] = await Promise.all([
    GameBet.find(filter)
      .populate("round", "crashPoint serverSeedHash")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    GameBet.countDocuments(filter),
  ]);

  const items = bets.map((bet) => ({
    id: bet._id,
    roundId: bet.round?._id || null,
    crashPoint: bet.round?.crashPoint ?? null,
    serverSeedHash: bet.round?.serverSeedHash || null,
    amount: bet.amount,
    status: bet.status,
    cashoutMultiplier: bet.cashoutMultiplier,
    payout: bet.payout,
    createdAt: bet.createdAt,
  }));

  return Response.json({
    items,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  });
}
