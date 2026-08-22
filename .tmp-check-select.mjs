import { chromium } from "playwright";
import path from "path";

const outDir = "C:/Users/HAMZAR~1/AppData/Local/Temp/claude/c--Users-Hamza-Razzaq-Documents-test/b478748b-a4ef-4a80-942a-f0c9025569da/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 1000 } });

await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 60000 });
const emailTab = page.locator("button", { hasText: "Email" }).first();
if (await emailTab.count()) await emailTab.click();
await page.locator('input[type="email"]').fill("chaudaryhamza27@gmail.com");
await page.locator('input[type="password"]').fill("1234567890");
await page.locator('form button[type="submit"]').click().catch(async () => {
  await page.keyboard.press("Enter");
});
await page.waitForTimeout(1500);

const consoleErrors = [];
page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));

await page.goto("http://localhost:3000/withdraw", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1200);
const gotIt = page.locator('button', { hasText: "Got it" }).first();
if (await gotIt.count()) await gotIt.click().catch(() => {});
await page.waitForTimeout(300);

await page.screenshot({ path: path.join(outDir, "withdraw-defaultselect.png"), fullPage: true });
console.log("console errors:", consoleErrors);
await browser.close();
