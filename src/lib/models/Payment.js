import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["paypal", "paybost"], required: true },
    providerOrderId: { type: String, required: true },
    providerCaptureId: { type: String, default: null, sparse: true },
    // Integer cents — never floating-point dollars. Converted to whole demo-credit
    // units only at the point the wallet is credited (see src/lib/payments.js).
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "USD" },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"],
      default: "PENDING",
    },
    type: { type: String, enum: ["demo_deposit"], default: "demo_deposit" },
    creditedAt: { type: Date, default: null, sparse: true },
    rawCaptureResponse: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

PaymentSchema.index({ provider: 1, providerOrderId: 1 }, { unique: true });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
