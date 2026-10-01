import mongoose from "mongoose";

// One row per admin login. Only the newest row per admin is active; a new
// login ends the others with reason "replaced" (see api/auth/login).
const AdminLoginSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true, unique: true },
    ip: { type: String, default: "unknown" },
    userAgent: { type: String, default: "" },
    device: { type: String, default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    // Browser-reported position shared at login (required for admins).
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      place: { type: String, default: null }, // e.g. "Lahore, Punjab, Pakistan"
    },
    endedAt: { type: Date, default: null },
    endReason: { type: String, enum: ["replaced", "logout", null], default: null },
  },
  { timestamps: true }
);

AdminLoginSessionSchema.index({ createdAt: -1 });

export default mongoose.models.AdminLoginSession || mongoose.model("AdminLoginSession", AdminLoginSessionSchema);
