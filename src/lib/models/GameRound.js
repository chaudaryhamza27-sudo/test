import mongoose from "mongoose";

const GameRoundSchema = new mongoose.Schema(
  {
    serverSeed: { type: String, required: true },
    serverSeedHash: { type: String, required: true },
    crashPoint: { type: Number, required: true }, // basis points of multiplier, 100 = 1.00x
  },
  { timestamps: true }
);

GameRoundSchema.index({ createdAt: -1 });

export default mongoose.models.GameRound || mongoose.model("GameRound", GameRoundSchema);
