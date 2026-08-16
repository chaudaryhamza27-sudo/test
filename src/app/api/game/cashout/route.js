import dbConnect from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import { cashOutBet } from "../../../../lib/gameActions";

// REST fallback path for cashing out — see src/app/api/game/bet/route.js for
// why this is a thin wrapper over src/lib/gameActions.js.
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  await dbConnect();

  const result = await cashOutBet({ userId: user._id, slot: body?.slot });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });

  return Response.json(result);
}
