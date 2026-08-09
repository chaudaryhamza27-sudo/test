"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import {
  IconAccount,
  IconCopy,
  IconRefresh,
  IconWallet,
  IconDeposit,
  IconWithdraw,
  IconVip,
  IconGameHistory,
  IconTransaction,
  IconBell,
  IconGift,
  IconChevronRight,
} from "../icons";

export default function ProfilePage() {
  const router = useRouter();
  const [popup, setPopup] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  const uid = user?.uid || "—";
  const balance = user?.balance ?? 0;

  const openNotice = (msg) => setPopup(msg);
  const closeNotice = () => setPopup(null);

  const copyUid = () => {
    navigator.clipboard?.writeText(uid);
    openNotice("UID copied to clipboard.");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="kk-page">
      <section className="kk-account-banner">
        <div className="kk-account-row">
          <div className="kk-avatar">
            <IconAccount />
          </div>
          <div className="kk-account-info">
            <div className="kk-account-name">
              MemberU6S165E1
              <span className="kk-vip-badge">VIP0</span>
            </div>
            <button className="kk-uid-pill" onClick={copyUid}>
              UID | {uid}
              <IconCopy />
            </button>
          </div>
        </div>
      </section>

      <section className="kk-account-card">
        <div className="kk-account-balance-row">
          <div>
            <div className="lbl">Total balance</div>
            <b>Rs{Number(balance).toFixed(2)}</b>
          </div>
          <button className="kk-refresh-btn" onClick={() => window.location.reload()}>
            <IconRefresh />
          </button>
        </div>

        <div className="kk-account-actions">
          <Link href="/wallet" className="kk-action">
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#ff6b8f,#d6296a)" }}>
              <IconWallet />
            </div>
            <span>Wallet</span>
          </Link>
          <Link href="/deposit" className="kk-action">
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#ffb23d,#e8531b)" }}>
              <IconDeposit />
            </div>
            <span>Deposit</span>
          </Link>
          <Link href="/withdraw" className="kk-action">
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#4aa8ff,#1565e8)" }}>
              <IconWithdraw />
            </div>
            <span>Withdraw</span>
          </Link>
          <button className="kk-action" onClick={() => openNotice("VIP program")}>
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
              <IconVip />
            </div>
            <span>VIP</span>
          </button>
        </div>
      </section>

      <section className="kk-grid-2">
        <Link href="/transactions" className="kk-info-card">
          <div className="kk-info-icon" style={{ background: "linear-gradient(160deg,#4aa8ff,#1565e8)" }}>
            <IconGameHistory />
          </div>
          <div>
            <div className="kk-info-title">Game History</div>
            <div className="kk-info-sub">My game history</div>
          </div>
        </Link>
        <Link href="/transactions" className="kk-info-card">
          <div className="kk-info-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
            <IconTransaction />
          </div>
          <div>
            <div className="kk-info-title">Transaction</div>
            <div className="kk-info-sub">My transaction history</div>
          </div>
        </Link>
        <Link href="/deposit" className="kk-info-card">
          <div className="kk-info-icon" style={{ background: "linear-gradient(160deg,#ffb23d,#e8531b)" }}>
            <IconDeposit />
          </div>
          <div>
            <div className="kk-info-title">Deposit</div>
            <div className="kk-info-sub">My deposit history</div>
          </div>
        </Link>
        <Link href="/withdraw" className="kk-info-card">
          <div className="kk-info-icon" style={{ background: "linear-gradient(160deg,#ff6b8f,#d6296a)" }}>
            <IconWithdraw />
          </div>
          <div>
            <div className="kk-info-title">Withdraw</div>
            <div className="kk-info-sub">My withdraw history</div>
          </div>
        </Link>
      </section>

      <div className="kk-list">
        <button className="kk-list-item" onClick={() => openNotice("Notifications")}>
          <span className="kk-list-item-icon">
            <IconBell />
          </span>
          <span className="label">Notification</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </button>
        <button className="kk-list-item" onClick={() => openNotice("Gifts")}>
          <span className="kk-list-item-icon">
            <IconGift />
          </span>
          <span className="label">Gifts</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </button>
        <button className="kk-list-item" onClick={handleLogout}>
          <span className="kk-list-item-icon">
            <IconWithdraw style={{ transform: "rotate(90deg)" }} />
          </span>
          <span className="label">Logout Account</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </button>
      </div>

      <footer className="kk-footer">This account and its balance are placeholders for this UI preview.</footer>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeNotice}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">👤</div>
          <div className="kk-popup-title">Demo Mode</div>
          <p className="kk-popup-text">&quot;{popup}&quot; is a placeholder in this UI showcase — no real account data is connected.</p>
          <button className="kk-popup-btn" onClick={closeNotice}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
