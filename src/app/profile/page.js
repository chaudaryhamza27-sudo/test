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
  IconGameHistory,
  IconTransaction,
  IconChevronRight,
  IconGift,
  IconChartLine,
  IconGlobe,
  IconLogout,
  IconSettings,
  IconFeedback,
  IconMegaphone,
  IconHeadset,
  IconInfo,
  IconShield,
} from "../icons";

// Trust score is a 0-100 gauge the admin can adjust (see /admin User
// Control's Trust Score panel); this is just the user-facing readout.
function trustMessage(score) {
  if (score >= 70) return "Your account has an excellent trust rating.";
  if (score >= 30) return "Your account is active and verified for smooth gaming access.";
  return "Your account trust score is low — some features may be limited.";
}

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

  const openDemo = (label) => setNotice({ icon: "🛠️", title: label, text: `"${label}" is a placeholder in this UI showcase.` });

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
              <button type="button" className="kk-vip-badge" onClick={showVipInfo}>{tier}</button>
            </div>
            <button className="kk-uid-pill" onClick={copyUid}>
              UID | {uid}
              <IconCopy />
            </button>
            <div className="kk-last-login">
              Last login: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "…"}
            </div>
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
          <Link href="/support" className="kk-action">
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
              <IconHeadset />
            </div>
            <span>Support</span>
          </Link>
        </div>
      </section>

      {user && (
        <section className="kk-trust-card">
          <div className="kk-trust-head">
            <span>
              <IconShield style={{ width: 15, height: 15 }} /> Account Health
            </span>
            <b>{user.trustScore ?? 50}%</b>
          </div>
          <div className="kk-trust-bar">
            <div className="kk-trust-fill" style={{ width: `${user.trustScore ?? 50}%` }} />
          </div>
          <p>{trustMessage(user.trustScore ?? 50)}</p>
        </section>
      )}

      <section className="kk-grid-2">
        <Link href="/crash/history" className="kk-info-card">
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

      <div className="kk-section-head" style={{ padding: "18px 16px 8px" }}>
        <span className="kk-section-title" style={{ fontSize: 15 }}>Notification</span>
      </div>
      <div className="kk-list">
        <Link href="/activity" className="kk-list-item">
          <span className="kk-list-item-icon">
            <IconGift />
          </span>
          <span className="label">Gifts</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </Link>
        <Link href="/crash/history" className="kk-list-item">
          <span className="kk-list-item-icon">
            <IconChartLine />
          </span>
          <span className="label">Game statistics</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </Link>
        <button className="kk-list-item" onClick={() => openDemo("Language")}>
          <span className="kk-list-item-icon">
            <IconGlobe />
          </span>
          <span className="label">
            Language
            <small>English</small>
          </span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </button>
      </div>

      <div className="kk-section-head" style={{ padding: "18px 16px 8px" }}>
        <span className="kk-section-title" style={{ fontSize: 15 }}>Service center</span>
      </div>
      <section className="kk-quick-actions" style={{ justifyContent: "space-between" }}>
        <button className="kk-quick-action" onClick={() => openDemo("Settings")}>
          <span className="kk-quick-action-icon" style={{ background: "linear-gradient(160deg,#8891A3,#565D6E)" }}>
            <IconSettings />
          </span>
          <span>Settings</span>
        </button>
        <button className="kk-quick-action" onClick={() => openDemo("Feedback")}>
          <span className="kk-quick-action-icon" style={{ background: "linear-gradient(160deg,#4aa8ff,#1565e8)" }}>
            <IconFeedback />
          </span>
          <span>Feedback</span>
        </button>
        <Link href="/support" className="kk-quick-action">
          <span className="kk-quick-action-icon" style={{ background: "linear-gradient(160deg,#ffb23d,#e8531b)" }}>
            <IconMegaphone />
          </span>
          <span>Announcement</span>
        </Link>
        <Link href="/support" className="kk-quick-action">
          <span className="kk-quick-action-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
            <IconHeadset />
          </span>
          <span>Customer Service</span>
        </Link>
        <Link href="/legal" className="kk-quick-action">
          <span className="kk-quick-action-icon" style={{ background: "linear-gradient(160deg,#7c5cff,#4a2fd6)" }}>
            <IconInfo />
          </span>
          <span>About us</span>
        </Link>
      </section>

      <button type="button" className="kk-btn-outline" style={{ margin: "20px 16px", width: "calc(100% - 32px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={handleLogout}>
        <IconLogout style={{ width: 18, height: 18 }} />
        Log out
      </button>

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
