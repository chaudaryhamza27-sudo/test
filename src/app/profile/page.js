"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import {
  IconCopy,
  IconRefresh,
  IconChevronRight,
  IconLogout,
  IconSettings,
  IconFeedback,
  IconHeadset,
  IconInfo,
  IconShield,
  IconVip,
  IconDocument,
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

  const openNotifications = async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    const items = data.items || [];
    const text = items.length
      ? items.slice(0, 5).map((n) => `• ${n.title}`).join("\n")
      : "No notifications yet.";
    setNotice({ icon: "🔔", title: "Notification", text });
  };

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
            <img src="/game/avitorimag.png" alt="" />
          </div>
          <div className="kk-account-info">
            <div className="kk-account-name">
              {displayName}
              <button type="button" className="kk-vip-badge" onClick={showVipInfo}>
                <IconShield />
                {tier}
              </button>
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
            <img src="/game/wallet.png" alt="" className="kk-action-icon kk-action-icon-img" />
            <span>Wallet</span>
          </Link>
          <Link href="/deposit" className="kk-action">
            <img src="/game/deposit.png" alt="" className="kk-action-icon kk-action-icon-img" />
            <span>Deposit</span>
          </Link>
          <Link href="/withdraw" className="kk-action">
            <img src="/game/withdrawa.png" alt="" className="kk-action-icon kk-action-icon-img" />
            <span>Withdraw</span>
          </Link>
          <button type="button" className="kk-action kk-action-vip" onClick={showVipInfo}>
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
              <IconVip />
            </div>
            <span>VIP</span>
          </button>
        </div>
      </section>

      {user && (
        <section className="kk-trust-card">
          <div className="kk-trust-head">
            <span>
              <IconShield style={{ width: 15, height: 15 }} /> Trust Score
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
          <img src="/game/gamehis.png" alt="" className="kk-info-icon kk-info-icon-img" />
          <div>
            <div className="kk-info-title">Game History</div>
            <div className="kk-info-sub">My game history</div>
          </div>
        </Link>
        <Link href="/transactions" className="kk-info-card">
          <img src="/game/histrans.png" alt="" className="kk-info-icon kk-info-icon-img" />
          <div>
            <div className="kk-info-title">Transaction</div>
            <div className="kk-info-sub">My transaction history</div>
          </div>
        </Link>
        <Link href="/transactions?type=deposit" className="kk-info-card">
          <img src="/game/hisdeposit.png" alt="" className="kk-info-icon kk-info-icon-img" />
          <div>
            <div className="kk-info-title">Deposit</div>
            <div className="kk-info-sub">My deposit history</div>
          </div>
        </Link>
        <Link href="/transactions?type=withdraw" className="kk-info-card">
          <img src="/game/hiswithdr.png" alt="" className="kk-info-icon kk-info-icon-img" />
          <div>
            <div className="kk-info-title">Withdraw</div>
            <div className="kk-info-sub">My withdraw history</div>
          </div>
        </Link>
      </section>

      <div className="kk-list" style={{ marginTop: 18 }}>
        <button type="button" className="kk-list-item" onClick={openNotifications}>
          <img src="/game/notification.png" alt="" className="kk-list-item-icon kk-list-item-icon-img" />
          <span className="label">Notification</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </button>
        <Link href="/activity" className="kk-list-item">
          <img src="/game/gifts.png" alt="" className="kk-list-item-icon kk-list-item-icon-img" />
          <span className="label">Gifts</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </Link>
        <Link href="/crash/history" className="kk-list-item">
          <img src="/game/game.png" alt="" className="kk-list-item-icon kk-list-item-icon-img" />
          <span className="label">Game statistics</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </Link>
        <button type="button" className="kk-list-item" onClick={() => openDemo("Language")}>
          <img src="/game/lang.png" alt="" className="kk-list-item-icon kk-list-item-icon-img" />
          <span className="label">Language</span>
          <span className="kk-list-item-value">English</span>
          <span className="chev">
            <IconChevronRight />
          </span>
        </button>
      </div>

      <div className="kk-section-head" style={{ padding: "18px 16px 8px" }}>
        <span className="kk-section-title" style={{ fontSize: 15 }}>Service Center</span>
      </div>
      <section className="card" style={{ margin: "0 16px", padding: "18px 8px" }}>
        <div className="kk-quick-actions" style={{ padding: "0 8px", justifyContent: "space-between" }}>
          <Link href="/support" className="kk-quick-action">
            <span className="kk-quick-action-icon" style={{ background: "#fff", border: "1px solid var(--border)", color: "#1565e8" }}>
              <IconHeadset />
            </span>
            <span>24/7 Customer service</span>
          </Link>
          <Link href="/legal" className="kk-quick-action">
            <span className="kk-quick-action-icon" style={{ background: "#fff", border: "1px solid var(--border)", color: "#4a2fd6" }}>
              <IconInfo />
            </span>
            <span>About us</span>
          </Link>
          <Link href="/legal/privacy" className="kk-quick-action">
            <span className="kk-quick-action-icon" style={{ background: "#fff", border: "1px solid var(--border)", color: "#1a9450" }}>
              <IconShield />
            </span>
            <span>Privacy Policy</span>
          </Link>
          <Link href="/legal/terms" className="kk-quick-action">
            <span className="kk-quick-action-icon" style={{ background: "#fff", border: "1px solid var(--border)", color: "#e8531b" }}>
              <IconDocument />
            </span>
            <span>Terms &amp; Conditions</span>
          </Link>
        </div>
      </section>

      <button type="button" className="kk-btn-outline" style={{ margin: "20px 16px", width: "calc(100% - 32px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={handleLogout}>
        <IconLogout style={{ width: 18, height: 18 }} />
        Log out
      </button>
{/* 
      <footer className="kk-footer">This account and its balance are placeholders for this UI preview.</footer> */}

      <BottomNav />

      <div className={`popup ${notice ? "active" : ""}`} onClick={closeNotice}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">{notice?.icon || "👤"}</div>
          <div className="kk-popup-title">{notice?.title || ""}</div>
          <p className="kk-popup-text" style={{ whiteSpace: "pre-line" }}>{notice?.text || ""}</p>
          <button className="kk-popup-btn" onClick={closeNotice}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
