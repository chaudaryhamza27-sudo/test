// Trust score auto-set from a user's lifetime approved-deposit total: 15%
// from account creation until the first confirmed deposit, then 40%.
// Beyond that, further increases are admin-only (see /admin User Control's
// Trust Score panel) — this baseline never climbs past 40 on its own.
export function computeTrustScore(lifetimeDeposit) {
  if (Number(lifetimeDeposit) > 0) return 40;
  return 15;
}
