import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    phone: { type: String, default: null, index: true },
    email: { type: String, default: null, index: true },
    passwordHash: { type: String, required: true },
    balance: { type: Number, default: 0 },
    inviteCode: { type: String, required: true, unique: true },
    referredBy: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBanned: { type: Boolean, default: false },
    kycApproved: { type: Boolean, default: false },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
