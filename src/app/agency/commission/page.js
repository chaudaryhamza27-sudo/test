"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconWallet, IconHistory } from "../../icons";
import BottomNav from "../../components/BottomNav";

export default function CommissionDetailPage() {
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
        <span className="kk-header-title">Commission Detail</span>
        <span className="kk-header-side" />
      </header>

      <main>
        <section className="wallet-stats-grid" style={{ margin: "16px 16px 0" }}>
          <div className="card wallet-stat-card">
            <div className="wallet-stat-icon" style={{ background: "linear-gradient(160deg,#f2ab13,#c97a06)" }}>
              <IconWallet />
            </div>
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px" }}>Total Deposit Amount</span>
            <b>{loading ? "…" : `Rs${Number(stats?.depositAmount ?? 0).toLocaleString()}`}</b>
            <span>From your subordinates</span>
          </div>
          <div className="card wallet-stat-card">
            <div className="wallet-stat-icon" style={{ background: "linear-gradient(160deg,#a855f7,#6d28d9)" }}>
              <IconHistory />
            </div>
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px" }}>Deposit Count</span>
            <b>{loading ? "…" : stats?.depositCount ?? 0}</b>
            <span>Total number of deposits</span>
          </div>
        </section>

        <div className="kk-empty">
          <IconWallet style={{ margin: "0 auto" }} />
          <b>No commission earned yet</b>
          <span>Commission is calculated from your subordinates&apos; deposits — see the Rebate Ratio page for rates by level.</span>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
