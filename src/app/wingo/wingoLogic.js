// Pure Win Go rules — no React, no DOM. Ported from the standalone
// 51game-wingo project (offlineTimer.js / gameRecord.js / the rules dialog),
// so the page and the hook only ever ask this file "what period is it" and
// "what does this bet pay".

export const MODES = [
  { key: '30s', label: 'Win Go 30s', ms: 30_000 },
  { key: '1min', label: 'Win Go 1Min', ms: 60_000 },
  { key: '3min', label: 'Win Go 3Min', ms: 180_000 },
  { key: '5min', label: 'Win Go 5Min', ms: 300_000 },
];

export const modeByKey = (key) => MODES.find((m) => m.key === key) || MODES[0];

// Betting closes for the last 5 seconds of every period (the big countdown
// over the betting panel in the original).
export const LOCK_SECONDS = 5;

// 2% service fee: a 100 bet is a 98 contract.
export const SERVICE_FEE = 0.02;

export const BALANCE_CHIPS = [1, 10, 100, 1000];
export const MULTIPLIERS = [1, 5, 10, 20, 50, 100];
export const MAX_QUANTITY = 9999;

const pad = (n) => String(n).padStart(2, '0');

// Period numbering, same shape as the original offlineTimer.js:
// YYYYMMDD + "1000" + (50001 + periods elapsed since UTC midnight).
export function periodAt(mode, t) {
  const start = Math.floor(t / mode.ms) * mode.ms;
  const d = new Date(start);
  const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const index = Math.floor((start - midnight) / mode.ms);
  const issue = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}1000${50001 + index}`;
  return { issue, startsAt: start, endsAt: start + mode.ms };
}

// Deterministic draw per (mode, issue) — every tab, reload and history page
// agrees on what a given period drew, the same way a server-drawn result would.
export function resultFor(modeKey, issue) {
  let h = 0x811c9dc5;
  const s = `${modeKey}:${issue}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % 10;
}

// 0 = red+violet, 5 = green+violet, other evens red, other odds green.
export function colorsOf(n) {
  if (n === 0) return ['red', 'violet'];
  if (n === 5) return ['green', 'violet'];
  return n % 2 === 0 ? ['red'] : ['green'];
}

export const isBig = (n) => n >= 5;
export const sizeOf = (n) => (isBig(n) ? 'Big' : 'Small');

// Past N completed periods for a mode, newest first.
export function recentResults(mode, now, count, offset = 0) {
  const current = Math.floor(now / mode.ms) * mode.ms;
  return Array.from({ length: count }, (_, i) => {
    const { issue } = periodAt(mode, current - (offset + i + 1) * mode.ms);
    return { issue, number: resultFor(mode.key, issue) };
  });
}

// A selection is { kind: 'color', value: 'green'|'red'|'violet' },
// { kind: 'number', value: 0-9 } or { kind: 'size', value: 'big'|'small' }.
export function selectionLabel(sel) {
  if (sel.kind === 'number') return String(sel.value);
  return sel.value[0].toUpperCase() + sel.value.slice(1);
}

// Multiplier on the post-fee contract amount, per the rules dialog:
//   green: 1,3,7,9 → x2, 5 → x1.5      red: 2,4,6,8 → x2, 0 → x1.5
//   violet: 0,5 → x4.5                  number: exact match → x9
//   big: 5-9 → x2                       small: 0-4 → x2
export function payoutMultiplier(sel, n) {
  if (sel.kind === 'number') return sel.value === n ? 9 : 0;
  if (sel.kind === 'size') return (sel.value === 'big') === isBig(n) ? 2 : 0;
  if (sel.value === 'violet') return n === 0 || n === 5 ? 4.5 : 0;
  if (!colorsOf(n).includes(sel.value)) return 0;
  return n === 0 || n === 5 ? 1.5 : 2;
}

export function payoutFor(sel, amount, n) {
  const contract = amount * (1 - SERVICE_FEE);
  return Math.round(contract * payoutMultiplier(sel, n) * 100) / 100;
}

export const money = (n) =>
  Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
