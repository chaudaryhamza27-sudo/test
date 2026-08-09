import Notification from "./models/Notification";

export async function notifyUser(userId, { type, title, message }) {
  try {
    await Notification.create({ user: userId, type, title, message });
  } catch {
    // Notifications must never break the primary request flow.
  }
}
