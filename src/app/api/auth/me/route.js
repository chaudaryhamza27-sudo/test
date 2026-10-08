import { getCurrentUser } from "../../../../lib/auth";
import User from "../../../../lib/models/User";
import { reconcilePendingKaropayPayments } from "../../../../lib/payments";

// The header, menus and profile all call this route, so the pending-payment
// lookup runs at most once per user per interval. It matches the per-payment
// Karopay inquiry throttle in reconcilePendingKaropayPayments, so credits land
// just as fast; the deposit page's own status poll is unaffected.
const RECONCILE_CHECK_INTERVAL_MS = 20_000;
const lastReconcileCheck = new Map();

function shouldCheckPendingPayments(userId) {
  const now = Date.now();
  const key = String(userId);
  if (now - (lastReconcileCheck.get(key) || 0) < RECONCILE_CHECK_INTERVAL_MS) return false;
  if (lastReconcileCheck.size > 5000) {
    for (const [k, t] of lastReconcileCheck) if (now - t >= RECONCILE_CHECK_INTERVAL_MS) lastReconcileCheck.delete(k);
  }
  lastReconcileCheck.set(key, now);
  return true;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  // Auto-credit any of this user's Karopay deposits that succeeded but whose
  // notify callback hasn't landed — the profile/header poll this route, so
  // the new balance shows up without anyone clicking anything.
  let balance = user.balance;
  if (shouldCheckPendingPayments(user._id)) {
    try {
      const settled = await reconcilePendingKaropayPayments({ userId: user._id });
      if (settled > 0) balance = (await User.findById(user._id, "balance").lean())?.balance ?? balance;
    } catch (err) {
      console.error("[auth/me] Karopay auto-reconcile failed", err?.message);
    }
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
