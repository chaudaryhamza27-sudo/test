import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getActiveRound, getRoundPhase } from "@/lib/gameEngine";
import GameRound from "@/lib/models/GameRound";

// This development inspector is opened as a standalone HTML file, so its
// origin differs from the Next.js app. It does not use cookies or other
// credentials, therefore a public read-only CORS policy is sufficient.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  // Sirf development mode mein available
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Debug endpoint only available in development" },
      { status: 404, headers: corsHeaders },
    );
  }

  await dbConnect();
  const round = await getActiveRound();
  const info = getRoundPhase(round);
  
  const crashPointValue = round.crashPoint / 100; // 100 = 1.00x
  
  return NextResponse.json(
    {
      roundId: round._id.toString(),
      phase: info.phase,
      multiplier: info.multiplier || 1,
      crashPoint: crashPointValue,
      // YAHI IMPORTANT HAI: actual next round crash point
      nextCrashPoint: info.phase !== "DONE" ? crashPointValue : null,
      waitingEndsAt: info.waitingEndsAt || null,
      countdownSeconds: info.msLeft ? Math.max(0, info.msLeft / 1000) : 0,
      now: Date.now(),
    },
    { headers: corsHeaders },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
