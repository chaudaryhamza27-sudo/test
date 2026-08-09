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
  IconChevronRight,
  IconShield,
} from "../icons";

export default function ProfilePage() {
  const router = useRouter();
  const [notice, setNotice] = useState(null);
  const [user, setUser] = useState(null);
  const [vip, setVip] = useState(null);

  const loadUser = () => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"));
  };

  useEffect(loadUser, [router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile/vip")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setVip)
      .catch(() => setVip(null));
  }, [user]);

  const uid = user?.uid || "—";
  const balance = user?.balance ?? 0;
  const displayName = user?.name?.trim() || (user ? `Player #${uid}` : "…");
  const tier = vip?.tier || "Member";

  const closeNotice = () => setNotice(null);

  const copyUid = () => {
    navigator.clipboard?.writeText(uid);
    setNotice({ icon: "✅", title: "Copied", text: "UID copied to clipboard." });
  };

  const showVipInfo = () => {
    if (!vip) return;
    const text = vip.nextTier
      ? `You're on the ${vip.tier} tier with Rs${Number(vip.lifetimeDeposit).toLocaleString()} in lifetime deposits. Deposit Rs${Number(vip.amountToNextTier).toLocaleString()} more to reach ${vip.nextTier}.`
      : `You're on the ${vip.tier} tier with Rs${Number(vip.lifetimeDeposit).toLocaleString()} in lifetime deposits — the highest tier.`;
    setNotice({ icon: "👑", title: `${vip.tier} tier`, text });
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
              {displayName}
              <span className="kk-vip-badge">{tier}</span>
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
          <button className="kk-refresh-btn" onClick={loadUser}>
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
          <button className="kk-action" onClick={showVipInfo}>
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
              <IconVip />
            </div>
            <span>VIP</span>
          </button>
        </div>
      </section>

      <section className="kk-grid-2">
        <Link href="/game/history" className="kk-info-card">
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
        <Link href="/transactions?type=deposit" className="kk-info-card">
          <div className="kk-info-icon" style={{ background: "linear-gradient(160deg,#ffb23d,#e8531b)" }}>
            <IconDeposit />
          </div>
          <div>
            <div className="kk-info-title">Deposit</div>
            <div className="kk-info-sub">My deposit history</div>
          </div>
        </Link>
        <Link href="/transactions?type=withdraw" className="kk-info-card">
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
        <Link href="/legal" className="kk-list-item">
          <span className="kk-list-item-icon">
            <IconShield />
          </span>
          <span className="label">Legal & Support</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </Link>
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

      <div className={`popup ${notice ? "active" : ""}`} onClick={closeNotice}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">{notice?.icon || "👤"}</div>
          <div className="kk-popup-title">{notice?.title || ""}</div>
          <p className="kk-popup-text">{notice?.text || ""}</p>
          <button className="kk-popup-btn" onClick={closeNotice}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
