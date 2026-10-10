'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCK_SECONDS, periodAt } from './wingoLogic';

// Ticks once per wall-clock second (aligned to the second boundary, like the
// original gameRecord.js countdown) and derives the current period for
// `mode`. `now` is null until mount so server and client render the same
// placeholder instead of mismatching on time.
export function useWingoRound(mode, { voiceOn = true } = {}) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    let timer;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      timer = setTimeout(tick, 1000 - (t % 1000) + 5);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  const period = now === null ? null : periodAt(mode, now);
  const msLeft = period ? Math.max(0, period.endsAt - now) : mode.ms;
  const secondsLeft = Math.ceil(msLeft / 1000);
  const locked = period !== null && secondsLeft <= LOCK_SECONDS;

  // Countdown beeps: di1 on 5..2, di2 on the final second.
  const voiceRef = useRef({});
  const lastBeepRef = useRef(null);
  useEffect(() => {
    if (!locked || !voiceOn) return;
    const key = `${period.issue}:${secondsLeft}`;
    if (lastBeepRef.current === key) return;
    lastBeepRef.current = key;
    const src = secondsLeft > 1 ? '/wingo/di1.mp3' : '/wingo/di2.mp3';
    if (!voiceRef.current[src]) voiceRef.current[src] = new Audio(src);
    const el = voiceRef.current[src];
    el.currentTime = 0;
    el.play().catch(() => {});
  }, [locked, voiceOn, period?.issue, secondsLeft]);

  return { now, period, msLeft, secondsLeft, locked };
}
