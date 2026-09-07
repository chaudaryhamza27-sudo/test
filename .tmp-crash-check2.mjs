import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 420, height: 700 } });
const page = await context.newPage();

const email = `qa${Date.now()}@example.com`;
await page.request.post("http://localhost:3001/api/auth/signup", {
  data: { name: "QA Tester", email, password: "TestPass123", confirmPassword: "TestPass123" },
});

await page.goto("http://localhost:3001/crash", { waitUntil: "networkidle" });

let maxRunning = 0;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(500);
  const total = await page.locator(".crash-bets-meta b").textContent().catch(() => "?");
  const runningCount = await page.locator(".crash-cashout").evaluateAll((els) => els.filter((e) => e.textContent.trim() === "Running").length);
  const multEl = await page.locator(".crash-multiplier-big, .crash-multiplier, [class*=multiplier]").first().textContent().catch(() => "");
  maxRunning = Math.max(maxRunning, runningCount);
  console.log(`t=${(i * 0.5).toFixed(1)}s  TOTAL=${total}  running=${runningCount}  mult="${multEl.trim()}"`);
}
console.log("maxRunningSeen", maxRunning);

await browser.close();
