import dbConnect from "../../../../lib/mongodb";
import DepositAccount from "../../../../lib/models/DepositAccount";
import { requireAdmin } from "../../../../lib/auth";

const FIELDS = ["accountTitle", "bankName", "accountNumber", "iban", "branch", "accountType"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  await dbConnect();
  let account = await DepositAccount.findOne();
  if (!account) account = await DepositAccount.create({});
  return Response.json({ account });
}

export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const update = {};
  for (const field of FIELDS) {
    if (typeof body?.[field] === "string" && body[field].trim()) update[field] = body[field].trim().slice(0, 120);
  }
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Provide at least one field to update." }, { status: 400 });
  }
  update.updatedBy = admin._id;

  await dbConnect();
  let account = await DepositAccount.findOne();
  if (!account) account = await DepositAccount.create(update);
  else {
    Object.assign(account, update);
    await account.save();
  }

  return Response.json({ account });
}
