import dbConnect from "../../../../lib/mongodb";
import GameRound from "../../../../lib/models/GameRound";
import { getRoundPhase } from "../../../../lib/gameEngine";

export async function GET() {
  await dbConnect();

  const rounds = await GameRound.find({}).sort({ createdAt: -1 }).limit(20);
  const finished = rounds.filter((r) => {
    const info = getRoundPhase(r);
    return info.phase === "CRASHED" || info.phase === "DONE";
  });

  return Response.json({
    items: finished.map((r) => ({ id: r._id, crashPoint: r.crashPoint, createdAt: r.createdAt })),
  });
}
