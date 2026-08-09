import User from "./models/User";

// Atomically adjusts a user's balance. When delta is negative, the update only
// applies if the user currently has enough balance, which prevents the
// read-modify-save race that would otherwise let concurrent requests double-spend.
export async function adjustBalance(userId, delta) {
  const filter = { _id: userId };
  if (delta < 0) filter.balance = { $gte: -delta };

  const user = await User.findOneAndUpdate(filter, { $inc: { balance: delta } }, { new: true });
  return user; // null means the guard failed (insufficient balance) or the user doesn't exist
}
