import mongoose from "mongoose";

const GameBetSchema = new mongoose.Schema(
  {
    round: { type: mongoose.Schema.Types.ObjectId, ref: "GameRound", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Two independent bet panels per user per round (standard Aviator-style
    // dual betting — one manual, one auto, or any combination of both).
    slot: { type: Number, enum: [1, 2], default: 1 },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["placed", "cashed_out", "lost"], default: "placed" },
    cashoutMultiplier: { type: Number, default: null }, // plain multiplier, e.g. 2.35 == 2.35x — the RESULT once resolved
    autoCashoutTarget: { type: Number, default: null }, // optional target the server auto-cashes-out at once RUNNING reaches it
    payout: { type: Number, default: 0 },
  },
  { timestamps: true }
);

GameBetSchema.index({ round: 1, user: 1, slot: 1 }, { unique: true });

export default mongoose.models.GameBet || mongoose.model("GameBet", GameBetSchema);
