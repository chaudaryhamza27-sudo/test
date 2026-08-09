"use client";

import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import { IconCopy } from "../icons";

const STATS = [
  { key: "referrals", label: "Referred users" },
  { key: "depositedReferrals", label: "Referrals who deposited", tone: "green" },
  { key: "depositAmount", label: "Total deposit amount", tone: "orange", money: true },
  { key: "depositCount", label: "Total deposit count" },
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
        <section className="kk-agency-banner">
          <div className="big">{values.referrals}</div>
          <div className="pill">Your total referrals</div>
          <div className="note">Share your invite code to grow your referral network</div>
        </section>

        <div className="kk-agency-tabs">
          <button className={`kk-agency-tab ${range === "month" ? "active" : ""}`} onClick={() => setRange("month")}>
            This month
          </button>
          <button className={`kk-agency-tab ${range === "all" ? "active" : ""}`} onClick={() => setRange("all")}>
            All time
          </button>
        </div>

        <section className="kk-agency-stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="kk-agency-col">
            {STATS.slice(0, 2).map((s) => (
              <div className={`kk-agency-stat ${s.tone || ""}`} key={s.key}>
                <b>{loading ? "…" : s.money ? `Rs${Number(values[s.key]).toLocaleString()}` : values[s.key]}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="kk-agency-col">
            {STATS.slice(2, 4).map((s) => (
              <div className={`kk-agency-stat ${s.tone || ""}`} key={s.key}>
                <b>{loading ? "…" : s.money ? `Rs${Number(values[s.key]).toLocaleString()}` : values[s.key]}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{ margin: "18px 16px 0", padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Your invite code</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <b style={{ fontSize: 20, letterSpacing: 1, color: "var(--kk-text)" }}>{user?.inviteCode || "…"}</b>
            <button className="kk-qr-btn" style={{ margin: 0, width: "auto", padding: "10px 16px" }} onClick={() => copy("code", user.inviteCode)} disabled={!user?.inviteCode}>
              <IconCopy />
              {copied === "code" ? "Copied!" : "Copy code"}
            </button>
          </div>
          <button className="kk-qr-btn" style={{ marginTop: 14, marginLeft: 0, marginRight: 0 }} onClick={() => copy("link", inviteLink)} disabled={!inviteLink}>
            <IconCopy />
            {copied === "link" ? "Link copied!" : "Copy invite link"}
          </button>
        </section>

        <footer className="kk-footer">Invite friends and see how many of them deposit — real referral data, no real money.</footer>
      </main>

      <BottomNav />
    </div>
  );
}
