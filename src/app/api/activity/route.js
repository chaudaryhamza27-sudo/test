import dbConnect from "../../../lib/mongodb";
import Activity from "../../../lib/models/Activity";
import { getCurrentUser } from "../../../lib/auth";

const PAGE_SIZE = 20;

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  await dbConnect();

  const filter = { user: user._id };
  const [items, total] = await Promise.all([
    Activity.find(filter)
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
