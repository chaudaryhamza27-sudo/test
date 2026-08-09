import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    actorRole: { type: String, enum: ["user", "admin", "system"], required: true },
    action: { type: String, required: true, index: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

ActivitySchema.index({ createdAt: -1 });

export default mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
