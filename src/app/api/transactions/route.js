import dbConnect from "../../../lib/mongodb";
import Transaction from "../../../lib/models/Transaction";
import { getCurrentUser } from "../../../lib/auth";

const PAGE_SIZE = 15;
const VALID_TYPES = ["deposit", "withdraw", "game_bet", "game_win"];

// Older transactions do not have a dedicated reference field. This stable,
// readable value lets players quote an order to support without a migration.
function getOrderNumber(transaction) {
  const providerOrderId = transaction.meta?.providerOrderId;
  if (providerOrderId) return String(providerOrderId);

  const prefix = transaction.type === "withdraw" ? "WD" : transaction.type === "deposit" ? "DP" : "TX";
  const date = new Date(transaction.createdAt).toISOString().slice(0, 10).replaceAll("-", "");
  const id = String(transaction._id).slice(-8).toUpperCase();
  return `${prefix}-${date}-${id}`;
}

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const type = searchParams.get("type");

  await dbConnect();

  const filter = { user: user._id };
  if (type && type !== "all") {
    filter.type = type === "game" ? { $in: ["game_bet", "game_win"] } : type;
    if (!VALID_TYPES.includes(type) && type !== "game") {
      return Response.json({ error: "Invalid type filter." }, { status: 400 });
    }
  }

  const [rawItems, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Transaction.countDocuments(filter),
  ]);
  // Strip the (potentially multi-MB) proof image out of list responses.
  const items = rawItems.map(({ meta, ...t }) => ({
    ...t,
    orderNumber: getOrderNumber({ ...t, meta }),
    hasProof: Boolean(meta?.proofImage),
  }));

  return Response.json({
    items,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  });
}
