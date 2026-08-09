import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { requireAdmin } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activity";
import { notifyUser } from "../../../../lib/notifications";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  await dbConnect();
  const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 });
  return Response.json({ users });
}

export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json();
  const { userId, isBanned, balance } = body || {};
  if (!userId) return Response.json({ error: "userId is required." }, { status: 400 });

  await dbConnect();
  const user = await User.findById(userId);
  if (!user) return Response.json({ error: "User not found." }, { status: 404 });

  if (typeof isBanned === "boolean" && isBanned !== user.isBanned) {
    user.isBanned = isBanned;
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: isBanned ? "user_banned" : "user_unbanned",
      targetUser: user._id,
      message: `${isBanned ? "Banned" : "Unbanned"} account ${user.uid}.`,
    });
    await notifyUser(user._id, {
      type: isBanned ? "account_banned" : "account_unbanned",
      title: isBanned ? "Account disabled" : "Account re-enabled",
      message: isBanned
        ? "Your account has been disabled by an administrator."
        : "Your account has been re-enabled.",
    });
  }
  if (typeof balance === "number" && Number.isFinite(balance) && balance >= 0 && balance !== user.balance) {
    const previousBalance = user.balance;
    user.balance = balance;
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "balance_adjusted",
      targetUser: user._id,
      message: `Reset demo balance for ${user.uid} from Rs${Number(previousBalance).toLocaleString()} to Rs${Number(balance).toLocaleString()}.`,
    });
    await notifyUser(user._id, {
      type: "balance_adjusted",
      title: "Balance updated",
      message: `An administrator updated your demo balance to Rs${Number(balance).toLocaleString()}.`,
    });
  }
  await user.save();

  return Response.json({ user: { ...user.toObject(), passwordHash: undefined } });
}
