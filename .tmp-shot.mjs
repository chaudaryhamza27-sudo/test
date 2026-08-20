import { chromium } from "playwright";
import fs from "fs";
import path from "path";

function loadEnvLocal(root) {
  const envPath = path.join(root, ".env.local");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const root = "e:/test";
loadEnvLocal(root);
const email = process.env.ADMIN_SEED_EMAIL;
const password = process.env.ADMIN_SEED_PASSWORD;
const outDir = "C:/Users/LENOVO/AppData/Local/Temp/claude/e--test/cc1f66e7-1cd7-4f4e-bc19-a13f16e52cb9/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 60000 });
const emailTab = page.locator("button", { hasText: "Email Login" });
await emailTab.waitFor({ state: "visible", timeout: 30000 });
if (await emailTab.count()) await emailTab.click();
await page.locator('input[type="email"]').fill(email);
await page.locator('input[type="password"]').fill(password);
await page.locator('form button[type="submit"]').click().catch(async () => {
  await page.keyboard.press("Enter");
});
await page.waitForTimeout(3000);

await page.goto("http://localhost:3000/crash", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2500);

const stage = page.locator(".game-stage").first();

let caughtRunning = false;
for (let i = 0; i < 40; i++) {
  const running = await page.locator(".game-multiplier.running").count();
  if (running > 0) {
    await page.waitForTimeout(600);
    await stage.screenshot({ path: path.join(outDir, "poll-running.png") });
    caughtRunning = true;
    break;
  }
  const waiting = await page.locator(".game-waiting-badge").count();
  if (waiting > 0 && i === 0) {
    await stage.screenshot({ path: path.join(outDir, "poll-waiting.png") });
  }
  await page.waitForTimeout(500);
}
console.log("caughtRunning:", caughtRunning);

if (!caughtRunning) {
  await stage.screenshot({ path: path.join(outDir, "poll-fallback.png") });
}

await browser.close();
