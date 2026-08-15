"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconUsers, IconGift } from "../../icons";
import BottomNav from "../../components/BottomNav";

export default function SubordinateDataPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agency/stats?range=all")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/agency" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">Subordinate Data</span>
        <span className="kk-header-side" />
      </header>

      <main>
        <section className="wallet-stats-grid" style={{ margin: "16px 16px 0" }}>
          <div className="card wallet-stat-card">
            <div className="wallet-stat-icon" style={{ background: "linear-gradient(160deg,#4aa8ff,#1565e8)" }}>
              <IconUsers />
            </div>
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px" }}>Direct Subordinates</span>
            <b>{loading ? "…" : stats?.referrals ?? 0}</b>
            <span>Users you invited directly</span>
          </div>
          <div className="card wallet-stat-card">
            <div className="wallet-stat-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
              <IconGift />
            </div>
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px" }}>Deposited</span>
            <b>{loading ? "…" : stats?.depositedReferrals ?? 0}</b>
            <span>Subordinates who made a deposit</span>
          </div>
        </section>

        {!loading && (stats?.referrals ?? 0) === 0 ? (
          <div className="kk-empty">
            <IconUsers style={{ margin: "0 auto" }} />
            <b>No subordinates yet</b>
            <span>Share your invite code from the Agency page to grow your network.</span>
          </div>
        ) : (
          <div className="kk-empty">
            <span>Loading…</span>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
