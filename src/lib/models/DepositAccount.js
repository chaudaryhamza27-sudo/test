import mongoose from "mongoose";

// Singleton document (there's only ever one) holding the bank account details
// shown to users on the manual deposit flow, editable by an admin. Users send
// their deposit to this account, then upload proof — see api/deposit and
// api/admin/deposit-account.
const DepositAccountSchema = new mongoose.Schema(
  {
    accountTitle: { type: String, default: "Demo Wallet" },
    bankName: { type: String, default: "Meezan Bank" },
    accountNumber: { type: String, default: "1234-5678-9012-3456" },
    iban: { type: String, default: "PK12 MEZN 0000 1234 5678 9012" },
    branch: { type: String, default: "Gulberg Branch, Lahore" },
    accountType: { type: String, default: "Current Account" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.DepositAccount || mongoose.model("DepositAccount", DepositAccountSchema);
