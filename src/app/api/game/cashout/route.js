import dbConnect from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import { cashOutBet } from "../../../../lib/gameActions";

// REST fallback path for cashing out — see src/app/api/game/bet/route.js for
// why this is a thin wrapper over src/lib/gameActions.js.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();

  const result = await cashOutBet({ userId: user._id });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });

  return Response.json(result);
}
