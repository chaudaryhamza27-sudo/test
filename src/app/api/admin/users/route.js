import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { requireAdmin } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activity";
import { notifyUser } from "../../../../lib/notifications";

// Generates a random temporary password for admin-initiated resets. Admins
// never set or see a user's existing password (it's a one-way bcrypt hash) —
// this generates a brand-new one instead, revealed exactly once in the API
// response so the admin can relay it to the user out-of-band.
function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

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
  const { userId, isBanned, balance, resetPassword, newPassword: requestedPassword, kycApproved, trustScoreDelta } = body || {};
  if (!userId) return Response.json({ error: "userId is required." }, { status: 400 });

  await dbConnect();
  const user = await User.findById(userId);
  if (!user) return Response.json({ error: "User not found." }, { status: 404 });

  let newPassword;
  if (resetPassword === true || requestedPassword) {
    if (user.role === "admin") {
      return Response.json({ error: "Cannot reset another admin's password from here." }, { status: 400 });
    }
    if (requestedPassword) {
      if (
        requestedPassword.length < 8 ||
        !/[0-9]/.test(requestedPassword) ||
        !/[a-zA-Z]/.test(requestedPassword)
      ) {
        return Response.json(
          { error: "Password must be at least 8 characters and include a letter and a number." },
          { status: 400 }
        );
      }
      newPassword = requestedPassword;
    } else {
      // No password supplied — generate one server-side. Either way, an
      // admin can only ever SET a new password, never see the existing one.
      newPassword = generateTempPassword();
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "password_reset",
      targetUser: user._id,
      message: `Reset login password for ${user.uid}.`,
    });
    await notifyUser(user._id, {
      type: "password_reset",
      title: "Password reset",
      message: "An administrator reset your account password. If you didn't request this, contact support immediately.",
    });
  }

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
      title: isBanned ? "Withdrawals restricted" : "Withdrawals re-enabled",
      message: isBanned
        ? "An administrator has restricted withdrawals on your account. Contact support for help."
        : "Withdrawal access has been restored on your account.",
    });
  }
  if (typeof kycApproved === "boolean" && kycApproved !== user.kycApproved) {
    user.kycApproved = kycApproved;
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: kycApproved ? "kyc_approved" : "kyc_removed",
      targetUser: user._id,
      message: `${kycApproved ? "Approved" : "Removed"} KYC verification for ${user.uid}.`,
    });
    await notifyUser(user._id, {
      type: "kyc_updated",
      title: kycApproved ? "KYC verified" : "KYC verification removed",
      message: kycApproved
        ? "Your account has been KYC verified by an administrator."
        : "Your KYC verification was removed by an administrator.",
    });
  }

  if (typeof trustScoreDelta === "number" && Number.isFinite(trustScoreDelta) && trustScoreDelta !== 0) {
    const previous = user.trustScore ?? 50;
    user.trustScore = Math.max(0, Math.min(100, previous + trustScoreDelta));
    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "trust_score_adjusted",
      targetUser: user._id,
      message: `${trustScoreDelta > 0 ? "Increased" : "Decreased"} trust score for ${user.uid} from ${previous} to ${user.trustScore}.`,
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

  return Response.json({ user: { ...user.toObject(), passwordHash: undefined }, newPassword });
}
