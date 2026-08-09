"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconAccount, IconWallet, IconTransaction, IconShield, IconChevronRight } from "../icons";

// Shared header profile control — click to open, click outside to close.
// Same interaction pattern as NotificationBell, reused here so both
// dropdowns behave identically across every page that has one.
export default function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

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
