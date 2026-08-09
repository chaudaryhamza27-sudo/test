import mongoose from "mongoose";

// Singleton document (_id: "main") that points at the currently active round.
const GameEngineStateSchema = new mongoose.Schema({
  _id: { type: String, default: "main" },
  currentRoundId: { type: mongoose.Schema.Types.ObjectId, ref: "GameRound", default: null },
});

export default mongoose.models.GameEngineState || mongoose.model("GameEngineState", GameEngineStateSchema);
