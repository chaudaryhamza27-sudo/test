"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconAccount, IconWallet, IconTransaction, IconShield, IconChevronRight, IconSpeaker, IconMusicNote } from "../icons";
import { useSound } from "./SoundProvider";

// Shared header profile control — click to open, click outside to close.
// Same interaction pattern as NotificationBell, reused here so both
// dropdowns behave identically across every page that has one.
export default function ProfileMenu() {
  const router = useRouter();
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

  const handleLogout = async () => {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div ref={boxRef} className="notif-wrap">
      <button onClick={() => setOpen((v) => !v)} className="game-profile-btn" aria-label="Account menu">
        <IconAccount />
      </button>

      {open && (
        <div className="notif-dropdown profile-dropdown">
          {user && (
            <div className="profile-menu-user">
              <b>{user.email || user.phone || `Player #${user.uid}`}</b>
              <span>USER ID : {user.uid}</span>
            </div>
          )}

          <div className="profile-menu-toggle-row">
            <IconSpeaker />
            <span>Sound</span>
            <button
              type="button"
              className={`game-toggle ${soundOn ? "on" : ""}`}
              onClick={toggleSound}
              aria-label="Toggle sound effects"
            >
              <span className="game-toggle-knob" />
            </button>
          </div>
          <div className="profile-menu-toggle-row">
            <IconMusicNote />
            <span>Music</span>
            <button
              type="button"
              className={`game-toggle ${musicOn ? "on" : ""}`}
              onClick={toggleMusic}
              aria-label="Toggle background music"
            >
              <span className="game-toggle-knob" />
            </button>
          </div>

          <Link href="/profile" className="profile-menu-item" onClick={() => setOpen(false)}>
            <IconAccount />
            <span>Profile</span>
            <IconChevronRight className="chev" />
          </Link>
          <Link href="/wallet" className="profile-menu-item" onClick={() => setOpen(false)}>
            <IconWallet />
            <span>Wallet</span>
            <IconChevronRight className="chev" />
          </Link>
          <Link href="/transactions" className="profile-menu-item" onClick={() => setOpen(false)}>
            <IconTransaction />
            <span>Transactions</span>
            <IconChevronRight className="chev" />
          </Link>
          <Link href="/legal" className="profile-menu-item" onClick={() => setOpen(false)}>
            <IconShield />
            <span>Legal &amp; Support</span>
            <IconChevronRight className="chev" />
          </Link>
          <button className="profile-menu-item danger" onClick={handleLogout}>
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
