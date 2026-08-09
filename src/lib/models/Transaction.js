import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["deposit", "withdraw", "game_bet", "game_win"], required: true },
    amount: { type: Number, required: true },
    method: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, createdAt: -1 });

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
