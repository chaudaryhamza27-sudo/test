import mongoose from "mongoose";

// Singleton document — admin-editable content only (support status shown to
// users, a contact number, and which deposit method NAMES are advertised as
// available). No payment gateway credentials or API integration live here;
// this never moves money, same trust boundary as DepositAccount.
const SupportSettingsSchema = new mongoose.Schema(
  {
    online: { type: Boolean, default: true },
    whatsappNumber: { type: String, default: "" },
    announcementEnabled: { type: Boolean, default: false },
    announcementText: { type: String, default: "" },
    methods: {
      type: [
        {
          key: String,
          label: String,
          enabled: { type: Boolean, default: false },
        },
      ],
      default: [
        { key: "easypaisa", label: "EasyPaisa", enabled: false },
        { key: "jazzcash", label: "JazzCash", enabled: false },
        { key: "paybost", label: "Paybost", enabled: false },
      ],
    },
    // Independent from `methods` (deposits) — a method can be advertised for
    // deposits but not withdrawals, or vice versa.
    withdrawMethods: {
      type: [
        {
          key: String,
          label: String,
          enabled: { type: Boolean, default: false },
        },
      ],
      default: [
        { key: "easypaisa", label: "EasyPaisa", enabled: false },
        { key: "jazzcash", label: "JazzCash", enabled: false },
      ],
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.SupportSettings || mongoose.model("SupportSettings", SupportSettingsSchema);
