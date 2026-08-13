"use client";

import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import { IconCopy, IconUsers, IconCalendar, IconClock, IconWallet, IconHistory, IconShield, IconLink, IconGift } from "../icons";

const STATS = [
  { key: "referrals", label: "Referred Users", sub: "Users you invited", icon: IconUsers, bg: "linear-gradient(160deg,#4aa8ff,#1565e8)" },
  { key: "depositedReferrals", label: "Referrals who Deposited", sub: "Users who made a deposit", icon: IconGift, bg: "linear-gradient(160deg,#33d19a,#1a9450)" },
  { key: "depositAmount", label: "Total Deposit Amount", sub: "Total amount deposited", icon: IconWallet, bg: "linear-gradient(160deg,#f2ab13,#c97a06)", money: true },
  { key: "depositCount", label: "Total Deposit Count", sub: "Total number of deposits", icon: IconHistory, bg: "linear-gradient(160deg,#a855f7,#6d28d9)" },
];

export default function AgencyPage() {
  const [range, setRange] = useState("all");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/agency/stats?range=${range}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const values = {
    referrals: stats?.referrals ?? 0,
    depositedReferrals: stats?.depositedReferrals ?? 0,
    depositAmount: stats?.depositAmount ?? 0,
    depositCount: stats?.depositCount ?? 0,
  };

  const inviteLink = user?.inviteCode && typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${user.inviteCode}` : "";

  const copy = (label, text) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="kk-page">
      <header className="kk-header">
        <span className="kk-header-side" />
        <span className="kk-header-title">Agency</span>
        <span className="kk-header-side" />
      </header>

      <main>
        <section className="kk-agency-banner agency-hero">
          <div className="agency-hero-icon">
            <IconUsers />
          </div>
          <div className="big">{values.referrals}</div>
          <div className="pill">Your total referrals</div>
          <div className="note">Share your invite code to grow your referral network</div>
        </section>

        <div className="kk-agency-tabs">
          <button className={`kk-agency-tab ${range === "month" ? "active" : ""}`} onClick={() => setRange("month")}>
            <IconCalendar style={{ width: 14, height: 14 }} />
            This month
          </button>
          <button className={`kk-agency-tab ${range === "all" ? "active" : ""}`} onClick={() => setRange("all")}>
            <IconClock style={{ width: 14, height: 14 }} />
            All time
          </button>
        </div>

        <section className="wallet-stats-grid" style={{ margin: "16px 16px 0" }}>
          {STATS.map((s) => (
            <div className="card wallet-stat-card" key={s.key}>
              <div className="wallet-stat-icon" style={{ background: s.bg }}>
                <s.icon />
              </div>
              <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px" }}>{s.label}</span>
              <b>{loading ? "…" : s.money ? `Rs${Number(values[s.key]).toLocaleString()}` : values[s.key]}</b>
              <span>{s.sub}</span>
            </div>
          ))}
        </section>

        <section className="card agency-invite-card">
          <div className="agency-invite-head">
            <span>Your Invite Code</span>
            <button className="badge-pill badge-info agency-copy-btn" onClick={() => copy("code", user.inviteCode)} disabled={!user?.inviteCode}>
              <IconCopy style={{ width: 12, height: 12 }} />
              {copied === "code" ? "Copied!" : "Copy Code"}
            </button>
          </div>
          <div className="agency-invite-code">{user?.inviteCode || "…"}</div>
          <div className="agency-invite-badges">
            <span className="badge-pill badge-info">
              <IconShield style={{ width: 11, height: 11 }} />
              Unique
            </span>
            <span className="badge-pill" style={{ background: "rgba(168,85,247,.14)", color: "#c084fc" }}>
              <IconLink style={{ width: 11, height: 11 }} />
              Case Sensitive
            </span>
          </div>

          <button className="deposit-submit-btn" style={{ margin: "16px 0 0", width: "100%" }} onClick={() => copy("link", inviteLink)} disabled={!inviteLink}>
            <IconCopy style={{ width: 16, height: 16 }} />
            {copied === "link" ? "Link Copied!" : "Copy Invite Link"}
          </button>
        </section>

        <div className="agency-note">
          <IconShield style={{ width: 13, height: 13 }} />
          Invite friends and earn bonuses. All data is updated in real-time.
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
