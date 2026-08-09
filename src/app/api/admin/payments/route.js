import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import User from "../../../../lib/models/User";
import { requireAdmin } from "../../../../lib/auth";

const PAGE_SIZE = 20;

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = searchParams.get("status");
  const provider = searchParams.get("provider");
  const orderId = searchParams.get("orderId");
  const userQuery = searchParams.get("user");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  await dbConnect();

  const filter = {};
  if (provider && provider !== "all") filter.provider = provider;
  if (status && status !== "all") filter.status = status;
  if (orderId) filter.providerOrderId = { $regex: orderId.trim(), $options: "i" };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  let userIds = null;
  if (userQuery) {
    const users = await User.find(
      { $or: [{ uid: userQuery.trim() }, { email: { $regex: userQuery.trim(), $options: "i" } }] },
      "_id"
    );
    userIds = users.map((u) => u._id);
    filter.userId = { $in: userIds };
  }

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate("userId", "uid email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    Payment.countDocuments(filter),
  ]);

  return Response.json({
    items,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  });
}
