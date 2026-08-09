import dbConnect from "../../../../lib/mongodb";
import Activity from "../../../../lib/models/Activity";
import { requireAdmin } from "../../../../lib/auth";

const PAGE_SIZE = 25;

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const actorRole = searchParams.get("actorRole");

  await dbConnect();

  const filter = {};
  if (actorRole && ["user", "admin", "system"].includes(actorRole)) filter.actorRole = actorRole;

  const [items, total] = await Promise.all([
    Activity.find(filter)
      .populate("user", "uid email phone")
      .populate("targetUser", "uid email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    Activity.countDocuments(filter),
  ]);

  return Response.json({
    items,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  });
}
