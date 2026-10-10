import mongoose from "mongoose";

// One Win Go bet. Periods are pure time math (see app/wingo/wingoLogic.js)
// so there is no round document — a bet just records which mode/issue it is
// for and when that period ends; it is settled lazily the next time the
// player's client syncs after `endsAt` (see lib/wingo.js settleDueBets).
const WingoBetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["30s", "1min", "3min", "5min"], required: true },
    issue: { type: String, required: true },
    endsAt: { type: Date, required: true },
    selection: {
      kind: { type: String, enum: ["color", "number", "size"], required: true },
      value: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "won", "lost"], default: "pending" },
    number: { type: Number, default: null }, // the drawn result once settled
    payout: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WingoBetSchema.index({ user: 1, mode: 1, createdAt: -1 });
WingoBetSchema.index({ user: 1, status: 1, endsAt: 1 });

export default mongoose.models.WingoBet || mongoose.model("WingoBet", WingoBetSchema);
