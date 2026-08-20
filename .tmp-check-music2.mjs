import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });

// Intercept `new Audio()` before app code runs, so we can inspect real playback state.
await page.addInitScript(() => {
  const OrigAudio = window.Audio;
  window.__lastAudio = null;
  window.Audio = function (...args) {
    const el = new OrigAudio(...args);
    window.__lastAudio = el;
    return el;
  };
  window.Audio.prototype = OrigAudio.prototype;
});

await page.goto('http://localhost:3000/crash', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(500);

let state = await page.evaluate(() => {
  const a = window.__lastAudio;
  return a ? { exists: true, paused: a.paused, currentTime: a.currentTime, readyState: a.readyState, error: a.error && a.error.message } : { exists: false };
});
console.log('state before click:', JSON.stringify(state));

await page.mouse.click(200, 30);
await page.waitForTimeout(1500);

state = await page.evaluate(() => {
  const a = window.__lastAudio;
  return a ? { exists: true, paused: a.paused, currentTime: a.currentTime, readyState: a.readyState } : { exists: false };
});
console.log('state after click + wait:', JSON.stringify(state));

await browser.close();
