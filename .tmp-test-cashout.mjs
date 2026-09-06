import { chromium } from "playwright";
import { MongoClient } from "mongodb";

const BASE = "http://localhost:3001";
const email = `pxcashout_${Date.now()}@example.com`;
const password = "testpass123";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });

await page.request.post(`${BASE}/api/auth/signup`, { data: { email, password } });

// give the test user a balance so a bet can be placed
const client = await MongoClient.connect("mongodb://localhost:27017/test");
await client.db().collection("users").updateOne({ email }, { $set: { balance: 5000 } });
await client.close();

await page.goto(`${BASE}/crash`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// place a bet on the first panel
const firstBetBtn = page.locator(".crash-action-btn").first();
await firstBetBtn.click();
await page.waitForTimeout(300);
await page.screenshot({ path: ".tmp-after-place.png" });

// wait for the round to start flying, then cash out
await page.waitForTimeout(2000);
const cashoutBtn = page.locator(".crash-action-btn").first();
await cashoutBtn.click();
await page.waitForTimeout(500);
await page.screenshot({ path: ".tmp-after-cashout.png" });

// switch to My Bets tab
await page.locator("button:has-text('My Bets')").click();
await page.waitForTimeout(300);
await page.locator(".crash-bets-table").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({ path: ".tmp-my-bets-tab.png" });
await page.screenshot({ path: ".tmp-my-bets-full.png", fullPage: true });

await browser.close();
console.log("done");
