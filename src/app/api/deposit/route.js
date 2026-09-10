import dbConnect from "../../../lib/mongodb";
import Transaction from "../../../lib/models/Transaction";
import { getCurrentUser } from "../../../lib/auth";
import { logActivity } from "../../../lib/activity";
import { escapeTelegramHtml, sendTelegramMessage } from "../../../lib/telegram";

const MIN_DEPOSIT = 3000;
const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// Accepts a data: URI (what a client FileReader.readAsDataURL() produces),
// validates the declared mime type and an approximate decoded size, and
// returns it unchanged for storage. Returns null for anything invalid —
// caller treats that as "no valid proof supplied".
function validateProof(dataUri) {
  if (typeof dataUri !== "string") return null;
  const match = dataUri.match(/^data:([\w/+.-]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) return null;
  const [, mime, base64] = match;
  if (!ALLOWED_PROOF_TYPES.includes(mime)) return null;
  const approxBytes = Math.ceil((base64.length * 3) / 4);
  if (approxBytes > MAX_PROOF_BYTES) return null;
  return dataUri;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();
  const deposits = await Transaction.find({ user: user._id, type: "deposit" }).sort({ createdAt: -1 }).lean();
  // Strip the (potentially multi-MB) proof image out of list responses —
  // callers that need the actual image fetch it on demand.
  const safeDeposits = deposits.map(({ meta, ...d }) => ({ ...d, hasProof: Boolean(meta?.proofImage) }));
  return Response.json({ deposits: safeDeposits });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { amount, method, accountNumber, proofImage } = body || {};
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_DEPOSIT) {
    return Response.json({ error: `Minimum deposit is Rs${MIN_DEPOSIT}.` }, { status: 400 });
  }
  if (!method) {
    return Response.json({ error: "Payment method is required." }, { status: 400 });
  }

  let validatedProof = null;
  if (proofImage) {
    validatedProof = validateProof(proofImage);
    if (!validatedProof) {
      return Response.json({ error: "Payment proof must be a JPG, PNG or PDF under 5MB." }, { status: 400 });
    }
  }

  await dbConnect();
  const deposit = await Transaction.create({
    user: user._id,
    type: "deposit",
    amount: parsedAmount,
    method,
    accountNumber: accountNumber || "",
    status: "pending",
    meta: validatedProof ? { proofImage: validatedProof } : null,
  });

  await logActivity({
    user: user._id,
    actorRole: "user",
    action: "deposit_requested",
    message: `Requested a virtual deposit of Rs${parsedAmount.toLocaleString()}.`,
    meta: { transactionId: deposit._id, amount: parsedAmount },
  });

  await sendTelegramMessage(
    `💰 <b>New Deposit Request</b>\nUser: ${escapeTelegramHtml(user.name || user.uid)} (${escapeTelegramHtml(user.uid)})\nAmount: Rs${parsedAmount.toLocaleString()}\nMethod: ${escapeTelegramHtml(method)}\nAccount: ${escapeTelegramHtml(accountNumber || "-")}\nStatus: Pending`
  );

  // Don't echo the (potentially large) proof image back in the response —
  // the client already has it locally.
  const { meta, ...safeDeposit } = deposit.toObject();
  return Response.json({ deposit: { ...safeDeposit, meta: meta ? { hasProof: true } : null } });
}
