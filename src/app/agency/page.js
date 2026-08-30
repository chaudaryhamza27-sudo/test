"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";
import {
  IconCopy,
  IconUsers,
  IconCalendar,
  IconClock,
  IconWallet,
  IconHistory,
  IconShield,
  IconGift,
  IconQr,
  IconChevronRight,
  IconHeadset,
  IconChartLine,
} from "../icons";

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

  const copy = (label, text) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const openDemo = (label) => {
    setCopied(null);
    alert(`"${label}" is a placeholder in this UI showcase.`);
  };

  return (
    <div className="kk-page">
      <header className="kk-header">
        <span className="kk-header-side" />
        <span className="kk-header-title">Agency</span>
        <span className="kk-header-side" />
      </header>

      <main>
       <section className="card" style={{ margin: "16px 16px 0", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: "var(--kk-text)" }}>
              <IconChartLine style={{ width: 16, height: 16, color: "var(--kk-blue)" }} />
              Promotion Data
            </span>
            <div className="kk-agency-tabs" style={{ margin: 0, gap: 6 }}>
              <button className={`kk-agency-tab ${range === "month" ? "active" : ""}`} style={{ padding: "6px 10px", fontSize: 11.5 }} onClick={() => setRange("month")}>
                <IconCalendar style={{ width: 12, height: 12 }} />
                Month
              </button>
              <button className={`kk-agency-tab ${range === "all" ? "active" : ""}`} style={{ padding: "6px 10px",whiteSpace:"nowrap", fontSize: 11.5 }} onClick={() => setRange("all")}>
                <IconClock style={{ width: 12, height: 12 }} />
                All time
              </button>
            </div>
          </div>

          <div className="wallet-stats-grid" style={{ margin: 0 }}>
            {STATS.map((s) => (
              <div className="wallet-stat-card" key={s.key} style={{ background: "var(--surface-sunken)", border: "1px solid var(--border)", borderRadius: 14 }}>
                <div className="wallet-stat-icon" style={{ background: s.bg }}>
                  <s.icon />
                </div>
                <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px" }}>{s.label}</span>
                <b>{loading ? "…" : s.money ? `Rs${Number(values[s.key]).toLocaleString()}` : values[s.key]}</b>
                <span>{s.sub}</span>
              </div>
            ))}
          </div>
        </section>
      

        {/* <button type="button" className="kk-qr-btn" onClick={() => openDemo("Download QR Code")}>
          <IconQr />
          Download QR Code
        </button> */}

        <div className="kk-list" style={{ marginTop: 16 }}>
          <button className="kk-list-item" onClick={() => copy("code", user?.inviteCode)} disabled={!user?.inviteCode}>
            <span className="kk-list-item-icon">
              <IconCopy />
            </span>
            <span className="label">
              {copied === "code" ? "Copied!" : "Copy invitation code"}
              <small>{user?.inviteCode || "…"}</small>
            </span>
          </button>
          <Link href="/agency/subordinate" className="kk-list-item">
            <span className="kk-list-item-icon">
              <IconHistory />
            </span>
            <span className="label">Subordinate data</span>
            <span className="chev">
              <IconChevronRight />
            </span>
          </Link>
          <Link href="/agency/commission" className="kk-list-item">
            <span className="kk-list-item-icon">
              <IconWallet />
            </span>
            <span className="label">Commission detail</span>
            <span className="chev">
              <IconChevronRight />
            </span>
          </Link>
        </div>

        <div className="kk-list" style={{ marginTop: 12 }}>
          <Link href="/support" className="kk-list-item">
            <span className="kk-list-item-icon">
              <IconHeadset />
            </span>
            <span className="label">Agent line customer service</span>
            <span className="chev">
              <IconChevronRight />
            </span>
          </Link>
          <Link href="/agency/rebate-ratio" className="kk-list-item">
            <span className="kk-list-item-icon">
              <IconGift />
            </span>
            <span className="label">Rebate ratio</span>
            <span className="chev">
              <IconChevronRight />
            </span>
          </Link>
        </div>
  <section className="kk-agency-banner agency-hero">
          <div className="agency-hero-card">
            <div className="agency-hero-icon">
              <IconUsers />
            </div>
            <div className="big">{values.referrals}</div>
            <div className="pill">Your total referrals</div>
            <div className="note">Share your invite code to grow your referral network</div>
          </div>
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
