import mongoose from "mongoose";

// One Karopay payout (Cash Out) request sent by an admin. Kept separate from
// Payment (inbound deposits) so the deposit webhook/credit path can never
// match — and credit — a payout record.
const PayoutSchema = new mongoose.Schema(
  {
    merchantOrderId: { type: String, required: true, unique: true },
    merchantUserId: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    // The user withdrawal request this payout settles, when sent from the
    // Withdraws workflow. Null for a manual payout.
    withdrawal: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null, index: true },
    accountType: { type: String, enum: ["WALLET", "BANK"], required: true },
    accountProvider: { type: String, required: true },
    accountNumMasked: { type: String, required: true },
    // Integer paisa ("cent"), exactly what was sent to Karopay.
    amount: { type: Number, required: true },
    currency: { type: String, default: "PKR" },
    customerName: { type: String, required: true },
    customerCertMasked: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    customerIBANMasked: { type: String, default: "" },
    merchantUserIp: { type: String, default: "" },
    notifyUrl: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING", index: true },
    providerOrderId: { type: String, default: null },
    providerStatus: { type: String, default: null },
    providerCode: { type: Number, default: null },
    providerMsg: { type: String, default: "" },
    fee: { type: Number, default: null }, // cents
    transferReceipt: { type: String, default: "" },
    traceId: { type: String, default: "" },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    rawCallback: { type: mongoose.Schema.Types.Mixed, default: null },
    callbackCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    completedAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PayoutSchema.index({ createdAt: -1 });

export default mongoose.models.Payout || mongoose.model("Payout", PayoutSchema);
