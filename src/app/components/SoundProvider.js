"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const SoundContext = createContext(null);

const SOUND_KEY = "pk92_sound_on";
const MUSIC_KEY = "pk92_music_on";

// Short SFX are synthesized live via the Web Audio API — no external sound
// files to source/license, so "Sound" is genuinely functional the instant
// it's toggled on. "Music" loops /game/background.mp3.
const TONES = {
  click: [{ freq: 720, dur: 0.05, type: "square", gain: 0.05 }],
  bet: [{ freq: 440, dur: 0.09, type: "triangle", gain: 0.09 }],
  cashout: [
    { freq: 523, dur: 0.08, type: "sine", gain: 0.1 },
    { freq: 659, dur: 0.08, type: "sine", gain: 0.1, delay: 0.07 },
    { freq: 784, dur: 0.14, type: "sine", gain: 0.11, delay: 0.14 },
  ],
  crash: [{ freq: 160, dur: 0.35, type: "sawtooth", gain: 0.12 }],
};

export function SoundProvider({ children }) {
  const [soundOn, setSoundOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [ready, setReady] = useState(false);
  const audioCtxRef = useRef(null);
  const musicElRef = useRef(null);
  const pathname = usePathname();
  // Background music is a game-page feature — it should never keep playing
  // once you've navigated away to Wallet/Profile/etc. `musicOn` is still the
  // user's saved preference either way, this just gates actual playback.
  const onGamePage = pathname?.startsWith("/crash");

  useEffect(() => {
    setSoundOn(localStorage.getItem(SOUND_KEY) === "1");
    // Music defaults ON for first-time visitors (no stored preference yet);
    // once someone has actually toggled it, that explicit choice sticks.
    const storedMusic = localStorage.getItem(MUSIC_KEY);
    setMusicOn(storedMusic === null ? true : storedMusic === "1");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0");
  }, [soundOn, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(MUSIC_KEY, musicOn ? "1" : "0");
    if (musicOn && onGamePage) {
      // Created lazily, only on first actual use — an unconditional `new
      // Audio(src)` fetches eagerly on mount even while the toggle is off.
      if (!musicElRef.current) {
        const el = new Audio("/game/background.mp3");
        el.loop = true;
        el.volume = 0.35;
        musicElRef.current = el;
      }
      musicElRef.current.play().catch(() => {
        // Most browsers block audio-with-sound autoplay until the user has
        // interacted with the page at least once — toggle still reads "on"
        // (honest — that IS the saved preference), playback just starts on
        // their first click/tap instead of immediately on load.
      });
    } else {
      musicElRef.current?.pause();
    }
  }, [musicOn, onGamePage, ready]);

  // Browsers block audio-with-sound autoplay before any user gesture — so
  // when music is on (including the first-visit default) but still paused
  // because of that policy, start it on the visitor's first tap/click/key.
  useEffect(() => {
    if (!ready) return;
    const tryResume = () => {
      if (musicOn && onGamePage && musicElRef.current?.paused) musicElRef.current.play().catch(() => {});
    };
    document.addEventListener("pointerdown", tryResume);
    document.addEventListener("keydown", tryResume);
    return () => {
      document.removeEventListener("pointerdown", tryResume);
      document.removeEventListener("keydown", tryResume);
    };
  }, [musicOn, onGamePage, ready]);

  const playTone = useCallback(
    (name) => {
      if (!soundOn) return;
      const steps = TONES[name];
      if (!steps) return;
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      for (const step of steps) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = step.type;
        osc.frequency.value = step.freq;
        const start = now + (step.delay || 0);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(step.gain, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + step.dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + step.dur + 0.02);
      }
    },
    [soundOn]
  );

  const toggleSound = useCallback(() => setSoundOn((v) => !v), []);
  const toggleMusic = useCallback(() => setMusicOn((v) => !v), []);

  return (
    <SoundContext.Provider value={{ soundOn, musicOn, toggleSound, toggleMusic, playTone }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound() must be used inside <SoundProvider>");
  return ctx;
}
