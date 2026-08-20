import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
const logs = [];
page.on('console', (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
page.on('pageerror', (err) => logs.push('pageerror: ' + err.message));

await page.goto('http://localhost:3000/crash', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);

const debugState = await page.evaluate(() => window.__soundDebug);
console.log('soundDebug:', JSON.stringify(debugState));
console.log('logs:', JSON.stringify(logs));

await browser.close();
