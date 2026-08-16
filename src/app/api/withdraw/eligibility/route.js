import dbConnect from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import { getWithdrawEligibility } from "../../../../lib/wallet";

// Lets the withdraw page decide what to show before the user fills out the
// form. Read-only — the actual enforcement lives in POST /api/withdraw,
// which runs this same check server-side regardless of what the client saw.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();
  const eligibility = await getWithdrawEligibility(user._id);
  return Response.json(eligibility);
}
