import dbConnect from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import { placeWingoBet } from "../../../../lib/wingo";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  await dbConnect();

  const result = await placeWingoBet({
    userId: user._id,
    modeKey: body?.mode,
    issue: body?.issue,
    selection: body?.selection,
    amount: body?.amount,
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });

  return Response.json(result);
}
