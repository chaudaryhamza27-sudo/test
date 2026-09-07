import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 420, height: 700 } });
const page = await context.newPage();
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

const email = `qa${Date.now()}@example.com`;
await page.request.post("http://localhost:3001/api/auth/signup", {
  data: { name: "QA Tester", email, password: "TestPass123", confirmPassword: "TestPass123" },
});

await page.goto("http://localhost:3001/crash", { waitUntil: "networkidle" });

for (let i = 0; i < 5; i++) {
  await page.waitForTimeout(2500);
  const total = await page.locator(".crash-bets-meta b").textContent().catch(() => "?");
  const runningCount = await page.locator(".crash-cashout").evaluateAll((els) => els.filter((e) => e.textContent.trim() === "Running").length);
  const badge = await page.locator(".crash-multiplier, .crash-status, [class*=phase]").first().textContent().catch(() => "");
  console.log(`t=${i * 2.5}s  TOTAL BETS=${total}  runningRowsVisible=${runningCount}`);
}

await page.screenshot({ path: ".tmp-crash-state.png" });
await browser.close();
