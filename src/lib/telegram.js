// Admin alerts via Telegram. Deposit alerts use TELEGRAM_BOT_TOKEN; withdrawal
// alerts use TELEGRAM_WITHDRAW_TOKEN (falling back to TELEGRAM_BOT_TOKEN if
// unset), both sent to the same TELEGRAM_CHAT_ID. Failures are reported in the
// server log but never thrown, so a Telegram outage cannot break a
// deposit/withdraw request.
export async function sendTelegramMessage(text, { withdraw = false } = {}) {
  const token = withdraw
    ? process.env.TELEGRAM_WITHDRAW_TOKEN || process.env.TELEGRAM_BOT_TOKEN
    : process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error(
      `Telegram notification skipped: ${withdraw ? "TELEGRAM_WITHDRAW_TOKEN/TELEGRAM_BOT_TOKEN" : "TELEGRAM_BOT_TOKEN"} or TELEGRAM_CHAT_ID is missing.`
    );
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      console.error(
        `Telegram notification failed: ${result?.description || `HTTP ${response.status}`}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `Telegram notification failed: ${error instanceof Error ? error.message : "Unknown request error"}`
    );
    return false;
  }
}

// All message templates use Telegram HTML. Escape dynamic values so a user
// name, payment method, or rejection reason cannot break the whole message.
export function escapeTelegramHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
