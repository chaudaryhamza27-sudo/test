import dbConnect from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import { placeBet } from "../../../../lib/gameActions";

// REST fallback path for placing a bet — used when the realtime-server isn't
// configured/reachable. Shares the exact same business logic as the
// Socket.IO `bet:place` handler via src/lib/gameActions.js, so there is only
// one place that actually moves a balance or creates a GameBet.
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  await dbConnect();

  const result = await placeBet({ userId: user._id, amount: body?.amount, autoCashoutTarget: body?.autoCashoutTarget });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });

  return Response.json(result);
}
