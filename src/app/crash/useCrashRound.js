'use client';

import { useEffect, useRef, useState } from 'react';

/*
 * useCrashRound — round state for the UI.
 *
 * source: 'server' (default)
 *   Subscribes to an SSE endpoint that streams the round the engine is already
 *   running. The browser receives phase, multiplier and elapsed; it never
 *   computes them. Expected event payloads from /api/game/stream:
 *
 *     { phase: 'betting',  roundId, betsCloseAt }        // ms epoch
 *     { phase: 'flying',   roundId, startedAt }          // ms epoch
 *     { phase: 'crashed',  roundId, crashPoint }
 *
 *   Between messages the multiplier is interpolated locally so the number moves
 *   at 60fps instead of at the tick rate — but the crash point, the payout and
 *   the authoritative multiplier at cash-out all come from the server. The
 *   interpolation is cosmetic and is discarded the moment a message arrives.
 *
 * source: 'demo'
 *   A local loop for developing the UI with no backend running. It generates a
 *   crash point in the browser, so it is for local UI work only — never ship a
 *   build where the client decides the crash point.
 */

const BASE_GROWTH = 0.10;     // must match the server's multiplier curve
const GROWTH_JITTER = 0.18;   // +/-18%, so each round climbs at its own pace
const BET_WINDOW_MS = 5000;   // demo only

export const multiplierAt = (seconds, rate = BASE_GROWTH) => Math.exp(rate * seconds);

export default function useCrashRound({ source = 'server', endpoint = '/api/game/stream' } = {}) {
  const [round, setRound] = useState({ phase: 'betting', roundId: null, crashPoint: null });
  const [tick, setTick] = useState({ multiplier: 1, elapsed: 0, countdown: 0 });
  const markRef = useRef({ startedAt: 0, betsCloseAt: 0 });

  /* ---- transport ------------------------------------------------------- */
  useEffect(() => {
    if (source === 'demo') return undefined;

    const es = new EventSource(endpoint);
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      markRef.current = {
        startedAt: msg.startedAt ?? markRef.current.startedAt,
        betsCloseAt: msg.betsCloseAt ?? markRef.current.betsCloseAt,
      };
      setRound({
        phase: msg.phase,
        roundId: msg.roundId,
        crashPoint: msg.crashPoint ?? null,
      });
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [source, endpoint]);

  /* ---- local demo engine (development only) ---------------------------- */
  useEffect(() => {
    if (source !== 'demo') return undefined;
    let timer;

    const startBetting = () => {
      markRef.current.betsCloseAt = Date.now() + BET_WINDOW_MS;
      setRound({ phase: 'betting', roundId: Date.now(), crashPoint: null });
      timer = setTimeout(takeOff, BET_WINDOW_MS);
    };

    const takeOff = () => {
      const r = Math.random();
      const crashPoint = Math.min(Math.max(1, Math.floor((0.97 / (1 - r)) * 100) / 100), 40);
      const rate = BASE_GROWTH * (1 + (Math.random() * 2 - 1) * GROWTH_JITTER);
      markRef.current.startedAt = Date.now();
      markRef.current.rate = rate;
      setRound((prev) => ({ ...prev, phase: 'flying', crashPoint, growthRate: rate }));
      const flightMs = (Math.log(crashPoint) / rate) * 1000;
      timer = setTimeout(() => {
        setRound((prev) => ({ ...prev, phase: 'crashed' }));
        timer = setTimeout(startBetting, 2400);
      }, Math.max(0, flightMs));
    };

    startBetting();
    return () => clearTimeout(timer);
  }, [source]);

  /* ---- cosmetic interpolation ------------------------------------------ */
  useEffect(() => {
    let raf;
    const frame = () => {
      const now = Date.now();
      if (round.phase === 'flying') {
        const rate = markRef.current.rate || BASE_GROWTH;
        const elapsed = (now - markRef.current.startedAt) / 1000;
        const m = multiplierAt(elapsed, rate);
        const capped = round.crashPoint ? Math.min(m, round.crashPoint) : m;
        setTick({ multiplier: capped, elapsed, countdown: 0 });
      } else if (round.phase === 'crashed') {
        const at = round.crashPoint ?? 1;
        const rate = markRef.current.rate || BASE_GROWTH;
        setTick({ multiplier: at, elapsed: Math.log(at) / rate, countdown: 0 });
      } else {
        const left = markRef.current.betsCloseAt - now;
        const total = BET_WINDOW_MS;
        setTick({ multiplier: 1, elapsed: 0, countdown: Math.min(1, Math.max(0, 1 - left / total)) });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [round.phase, round.crashPoint]);

  return { ...round, ...tick };
}
