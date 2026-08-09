"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconEagle, IconChevronLeft } from "../icons";
import ProfileMenu from "./ProfileMenu";

const money = (n) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TRUST_BADGES = [
  { icon: "⚡", label: "Real", sub: "Simulated funds" },
  { icon: "🪙", label: "Demo test", sub: "Safe to try" },
  // { icon: "🛡️", label: "No", sub: "Real payments" },
];

// One shared header for the "app-shell" family of pages (Deposit, Withdraw,
// Game) — logo/back, trust badges, balance, and the account dropdown, so
// none of those pages hand-roll their own header markup anymore.
export default function AppShellHeader({ subtitle = "UI Showcase", showTrustBadges = true, balance: controlledBalance }) {
  const [fetchedBalance, setFetchedBalance] = useState(null);
  const isControlled = controlledBalance !== undefined;

  useEffect(() => {
    if (isControlled) return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setFetchedBalance(data.user.balance))
      .catch(() => setFetchedBalance(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const balance = isControlled ? controlledBalance : fetchedBalance;

  return (
    <header className="topbar app-header">
      <div className="app-header-left">
        <Link href="/" className="kk-header-icon-btn" aria-label="Back">
          <IconChevronLeft />
        </Link>
        <Link href="/" className="brand-logo">
          <div className="brand-mark"><IconEagle style={{ width: 24, height: 24 }} /></div>
          <div className="brand-copy">
            <b>PK92</b>
            <span>{subtitle}</span>
          </div>
        </Link>
      </div>

      {showTrustBadges && (
        <div className="app-header-trust">
          {TRUST_BADGES.map((b) => (
            <div className="app-trust-badge" key={b.label}>
              <span>{b.icon}</span>
              <div>
                <b>{b.label}</b>
                <span>{b.sub}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="game-header-right">
        <div className="game-balance-block">
          <div className="lbl">Balance</div>
          <div className="val">Rs {balance === null ? "0.00" : money(balance)}</div>
        </div>
        <Link href="/deposit#deposit-options" className="badge-pill badge-info" style={{ textDecoration: "none", height: 34, padding: "0 14px" }}>
          + Add Funds
        </Link>
        <ProfileMenu />
      </div>
    </header>
  );
}
