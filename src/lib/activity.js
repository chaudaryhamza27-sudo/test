import Activity from "./models/Activity";

export async function logActivity({ user = null, actorRole, action, targetUser = null, message, meta = null }) {
  try {
    await Activity.create({ user, actorRole, action, targetUser, message, meta });
  } catch {
    // Activity logging must never break the primary request flow.
  }
}
