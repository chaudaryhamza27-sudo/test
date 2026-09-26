import { getCurrentUser } from "../../../../lib/auth";
import User from "../../../../lib/models/User";
import { reconcilePendingKaropayPayments } from "../../../../lib/payments";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  // Auto-credit any of this user's Karopay deposits that succeeded but whose
  // notify callback hasn't landed — the profile/header poll this route, so
  // the new balance shows up without anyone clicking anything.
  let balance = user.balance;
  try {
    const settled = await reconcilePendingKaropayPayments({ userId: user._id });
    if (settled > 0) balance = (await User.findById(user._id, "balance").lean())?.balance ?? balance;
  } catch (err) {
    console.error("[auth/me] Karopay auto-reconcile failed", err?.message);
  }

  return Response.json({
    user: {
      uid: user.uid,
      phone: user.phone,
      email: user.email,
      balance,
      role: user.role,
      inviteCode: user.inviteCode,
      kycApproved: user.kycApproved,
      trustScore: user.trustScore,
      isBanned: user.isBanned,
      lastLoginAt: user.lastLoginAt,
    },
  });
}
