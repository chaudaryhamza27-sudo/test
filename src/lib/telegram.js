// Fire-and-forget admin alerts via Telegram. Configured through
// TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID env vars — silently does nothing if
// either is missing, and never throws, so a Telegram outage can't break a
// deposit/withdraw request.
export async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch {
    // Best-effort notification — ignore network/API failures.
  }
}
