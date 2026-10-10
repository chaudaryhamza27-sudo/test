import dbConnect from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import User from "../../../../lib/models/User";
import { modeOrNull, recentBets, recentResults, settleDueBets } from "../../../../lib/wingo";

const PAGE_SIZE = 10;
const MAX_PAGES = 10;

// One sync call for the Win Go page: settles the player's finished bets,
// then returns the fresh balance, result history for the selected mode and
// the player's own recent bets. Signed-out visitors still get the history.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = modeOrNull(searchParams.get("mode"));
  if (!mode) return Response.json({ error: "Unknown game mode." }, { status: 400 });
  const page = Math.min(MAX_PAGES - 1, Math.max(0, parseInt(searchParams.get("page") || "0", 10) || 0));

  const now = Date.now();
  const results = recentResults(mode, now, PAGE_SIZE, page * PAGE_SIZE);
  const lastFive = page === 0 ? results.slice(0, 5) : recentResults(mode, now, 5);

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ signedIn: false, balance: null, settled: [], results, lastFive, myBets: [] });
  }

  await dbConnect();
  const settled = await settleDueBets(user._id);
  const myBets = await recentBets(user._id, mode.key);
  // Re-read after settlement credited any wins.
  const fresh = await User.findById(user._id).select("balance").lean();

  return Response.json({ signedIn: true, balance: fresh?.balance ?? user.balance, settled, results, lastFive, myBets });
}
