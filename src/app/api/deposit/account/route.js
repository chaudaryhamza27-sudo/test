import dbConnect from "../../../../lib/mongodb";
import DepositAccount from "../../../../lib/models/DepositAccount";
import { getCurrentUser } from "../../../../lib/auth";

// Read-only for regular users — the account they should send a manual
// deposit to. Auto-creates the singleton with sensible demo defaults the
// first time anyone asks, so there's always something to show.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();
  let account = await DepositAccount.findOne();
  if (!account) account = await DepositAccount.create({});

  return Response.json({
    accountTitle: account.accountTitle,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    iban: account.iban,
    branch: account.branch,
    accountType: account.accountType,
  });
}
