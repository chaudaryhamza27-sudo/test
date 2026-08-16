// Trust score auto-set from a user's lifetime approved-deposit total —
// admins can still fetch/increase/decrease it by hand afterward (see
// /admin User Control's Trust Score panel); this just sets the baseline
// whenever a deposit is approved.
export function computeTrustScore(lifetimeDeposit) {
  if (lifetimeDeposit > 17000) return 100;
  if (lifetimeDeposit > 10000) return 90;
  if (lifetimeDeposit > 3000) return 70;
  return 40;
}
