"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const SoundContext = createContext(null);

// One-shot game SFX, gated by the "Sound" toggle. "Music" is the separate
// looping /game/background.mp3, gated by its own toggle below.
const SFX_SRC = {
  start: "/game/game-start.mp3",
  cashout: "/game/cashout_2.mp3",
  crash: "/game/plane-crash.mp3",
};

export function SoundProvider({ children }) {
  const pathname = usePathname();
  // Sound/Music default ON while on a game page (/crash) and OFF everywhere
  // else. This is a per-page default, not a persisted user preference — it
  // resets whenever you cross the game/non-game boundary, but toggling still
  // overrides it for as long as you stay in that boundary.
  const onGamePage = pathname?.startsWith("/crash");
  const [soundOn, setSoundOn] = useState(onGamePage);
  const [musicOn, setMusicOn] = useState(onGamePage);
  const onGamePageRef = useRef(onGamePage);
  const musicElRef = useRef(null);
  const sfxElsRef = useRef({});

  useEffect(() => {
    if (onGamePageRef.current === onGamePage) return;
    onGamePageRef.current = onGamePage;
    setSoundOn(onGamePage);
    setMusicOn(onGamePage);
  }, [onGamePage]);

  useEffect(() => {
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
  }, [musicOn, onGamePage]);

  // Browsers block audio-with-sound autoplay before any user gesture — so
  // when music is on (including the first-visit default) but still paused
  // because of that policy, start it on the visitor's first tap/click/key.
  useEffect(() => {
    const tryResume = () => {
      if (musicOn && onGamePage && musicElRef.current?.paused) musicElRef.current.play().catch(() => {});
    };
    document.addEventListener("pointerdown", tryResume);
    document.addEventListener("keydown", tryResume);
    return () => {
      document.removeEventListener("pointerdown", tryResume);
      document.removeEventListener("keydown", tryResume);
    };
  }, [musicOn, onGamePage]);

  const playSfx = useCallback(
    (name) => {
      if (!soundOn) return;
      const src = SFX_SRC[name];
      if (!src) return;
      // Lazy + cached per name, same reasoning as the music element: don't
      // fetch every clip on mount, only the ones actually played.
      let el = sfxElsRef.current[name];
      if (!el) {
        el = new Audio(src);
        sfxElsRef.current[name] = el;
      }
      el.currentTime = 0;
      el.play().catch(() => {});
    },
    [soundOn]
  );

  const toggleSound = useCallback(() => setSoundOn((v) => !v), []);
  const toggleMusic = useCallback(() => setMusicOn((v) => !v), []);

  return (
    <SoundContext.Provider value={{ soundOn, musicOn, toggleSound, toggleMusic, playSfx }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound() must be used inside <SoundProvider>");
  return ctx;
}
