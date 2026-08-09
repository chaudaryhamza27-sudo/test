import dbConnect from "../../../../lib/mongodb";
import Notification from "../../../../lib/models/Notification";
import { getCurrentUser } from "../../../../lib/auth";

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  await dbConnect();
  await Notification.updateMany({ user: user._id, read: false }, { $set: { read: true } });

  return Response.json({ ok: true });
}
