"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconAccount, IconChevronRight, IconSpeaker, IconMusicNote, IconStar, IconDeposit, IconWithdraw } from "../icons";
import { useSound } from "./SoundProvider";

// Crash-page-only account dropdown. Same open/close/fetch-user pattern as
// the shared ProfileMenu, but its own dark styling (crash.css) and its own
// row of links — an Animation toggle plus Deposit/Withdraw shortcuts instead
// of Wallet/Transactions/Legal & Support.
export default function CrashProfileMenu({ animationsOn, onToggleAnimations }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const boxRef = useRef(null);
  const { soundOn, musicOn, toggleSound, toggleMusic } = useSound();

  useEffect(() => {
    if (!open || user) return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => {});
  }, [open, user]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={boxRef} className="notif-wrap">
      <button onClick={() => setOpen((v) => !v)} className="game-profile-btn" aria-label="Account menu">
        <IconAccount />
      </button>

      {open && (
        <div className="notif-dropdown crash-profile-dropdown">
          {user && (
            <div className="crash-profile-user">
              <b>{user.email || user.phone || `Player #${user.uid}`}</b>
              <span>USER ID : {user.uid}</span>
            </div>
          )}

          <div className="crash-profile-toggle-row">
            <IconSpeaker />
            <span>Sound</span>
            <button
              type="button"
              className={`game-toggle crash-toggle ${soundOn ? "on" : ""}`}
              onClick={toggleSound}
              aria-label="Toggle sound effects"
            >
              <span className="game-toggle-knob" />
            </button>
          </div>
          <div className="crash-profile-toggle-row">
            <IconMusicNote />
            <span>Music</span>
            <button
              type="button"
              className={`game-toggle crash-toggle ${musicOn ? "on" : ""}`}
              onClick={toggleMusic}
              aria-label="Toggle background music"
            >
              <span className="game-toggle-knob" />
            </button>
          </div>
          <div className="crash-profile-toggle-row">
            <IconStar />
            <span>Animation</span>
            <button
              type="button"
              className={`game-toggle crash-toggle ${animationsOn ? "on" : ""}`}
              onClick={onToggleAnimations}
              aria-label="Toggle flight animation"
            >
              <span className="game-toggle-knob" />
            </button>
          </div>

          <Link href="/deposit#deposit-options" className="crash-profile-item" onClick={() => setOpen(false)}>
            <IconDeposit />
            <span>Deposit Funds</span>
            <span className="crash-profile-dot" />
          </Link>
          <Link href="/withdraw" className="crash-profile-item" onClick={() => setOpen(false)}>
            <IconWithdraw />
            <span>Withdraw Funds</span>
            <IconChevronRight className="chev" />
          </Link>
          <Link href="/profile" className="crash-profile-item" onClick={() => setOpen(false)}>
            <IconAccount />
            <span>Profile</span>
            <IconChevronRight className="chev" />
          </Link>
        </div>
      )}
    </div>
  );
}
