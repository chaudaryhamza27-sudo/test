import dbConnect from "../../../lib/mongodb";
import Notification from "../../../lib/models/Notification";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();

  const [items, unreadCount] = await Promise.all([
    Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(30),
    Notification.countDocuments({ user: user._id, read: false }),
  ]);

  return Response.json({ items, unreadCount });
}
