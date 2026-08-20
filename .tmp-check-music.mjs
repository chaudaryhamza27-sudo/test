import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
const errors = [];
const audioRequests = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
page.on('request', (req) => { if (req.url().includes('background.mp3')) audioRequests.push(req.url()); });

await page.goto('http://localhost:3000/crash', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(500);
console.log('audio requests after load:', JSON.stringify(audioRequests));

// simulate a user gesture (click on the page body)
await page.mouse.click(50, 50);
await page.waitForTimeout(1000);
console.log('audio requests after click:', JSON.stringify(audioRequests));

// check localStorage for the music preference
const musicPref = await page.evaluate(() => localStorage.getItem('pk92_music_on'));
console.log('musicPref:', musicPref);

console.log('CONSOLE_ERRORS:', JSON.stringify(errors));
await browser.close();
