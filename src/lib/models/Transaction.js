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
// A user may have only one withdrawal awaiting an admin decision. The partial
// unique index makes this rule safe even when two submit requests race each
// other at the database level.
TransactionSchema.index(
  { user: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: "withdraw", status: "pending" } }
);

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
