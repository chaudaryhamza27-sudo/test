"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDeposit,
  IconWithdraw,
  IconHistory,
  IconTrendingUp,
  IconTrophy,
  IconShield,
  IconEye,
  IconEyeOff,
  IconCoinWallet,
} from "../icons";
import BottomNav from "../components/BottomNav";
import PayPalAddFunds from "../components/PayPalAddFunds";
import PaybostAddFunds from "../components/PaybostAddFunds";

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBalance(data.balance))
      .catch(() => router.push("/login"));
    fetch("/api/wallet/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setStats(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const money = (n) => `Rs${Number(n ?? 0).toLocaleString()}`;

  // The little line under each card is a decorative flourish only — matching
  // the reference's visual density — never a claim of real historical data,
  // since we only have current totals, not a time series.
  const OVERVIEW = [
    { key: "totalDeposited", label: "Total Deposited", sub: "Total amount added", icon: IconDeposit, bg: "linear-gradient(160deg,#33d19a,#1a9450)", tone: "win", line: "up", lineColor: "#33d19a" },
    { key: "totalWithdrawn", label: "Total Withdrawn", sub: "Total amount withdrawn", icon: IconWithdraw, bg: "linear-gradient(160deg,#ff6b6b,#c0392b)", tone: "lose", line: "down", lineColor: "#ff6b6b" },
    { key: "gameWagered", label: "Total Wagered", sub: "Amount used in games", icon: IconTrendingUp, bg: "linear-gradient(160deg,#4aa8ff,#1565e8)", line: "wave", lineColor: "#4aa8ff" },
    { key: "gameWon", label: "Total Won", sub: "Total winnings", icon: IconTrophy, bg: "linear-gradient(160deg,#f2ab13,#c97a06)", tone: "win", line: "up", lineColor: "#f2ab13" },
  ];

  const SPARK_POINTS = {
    up: "2,20 14,15 26,17 38,10 50,12 62,6 74,8 86,3 98,5",
    down: "2,4 14,8 26,6 38,12 50,10 62,15 74,13 86,19 98,17",
    wave: "2,12 14,7 26,15 38,9 50,14 62,6 74,11 86,8 98,13",
  };

  const QUICK_ACTIONS = [
    { href: "/deposit", label: "Deposit", sub: "Add money to your wallet", icon: IconDeposit, bg: "linear-gradient(160deg,#33d19a,#1a9450)", color: "#33d19a" },
    { href: "/withdraw", label: "Withdraw", sub: "Withdraw your earnings", icon: IconWithdraw, bg: "linear-gradient(160deg,#7c5cff,#4a2fd6)", color: "#9d84ff" },
    { href: "/transactions?type=deposit", label: "Deposit History", sub: "View all deposits", icon: IconHistory, bg: "linear-gradient(160deg,#ff6b8f,#d6296a)", color: "#ff6b8f" },
    { href: "/transactions?type=withdraw", label: "Withdrawal History", sub: "View all withdrawals", icon: IconHistory, bg: "linear-gradient(160deg,#2dd4bf,#0f9a8a)", color: "#2dd4bf" },
  ];

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">Wallet</span>
        <span className="badge-pill badge-info">
          <IconShield style={{ width: 11, height: 11 }} />
          100% Secure
        </span>
      </header>

      <main>
        <section className="kk-wallet-banner wallet-hero">
          <IconCoinWallet className="wallet-hero-watermark" />
          <div className="kk-wallet-label-row">
            <span>TOTAL BALANCE</span>
            <button className="wallet-eye-btn" onClick={() => setHidden((v) => !v)} aria-label="Toggle balance visibility">
              {hidden ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
          <div className="kk-wallet-balance">{hidden ? "Rs••••••" : `Rs${Number(balance).toFixed(2)}`}</div>
          <div className="kk-wallet-balance-label">Available to use</div>
        </section>

        <div className="wallet-quickpay-grid">
          <PayPalAddFunds
            theme="dark"
            triggerClassName="wallet-quickpay-btn"
            triggerLabel={
              <>
                <span className="wallet-quickpay-icon" style={{ background: "linear-gradient(160deg,#4aa8ff,#1565e8)" }}>+</span>
                <span className="wallet-quickpay-text">
                  <b>Add Funds (PayPal Sandbox)</b>
                  <span>Add money to your wallet</span>
                </span>
              </>
            }
            onBalanceChange={setBalance}
          />
          <PaybostAddFunds
            theme="dark"
            triggerClassName="wallet-quickpay-btn"
            triggerLabel={
              <>
                <span className="wallet-quickpay-icon" style={{ background: "linear-gradient(160deg,#7c5cff,#4a2fd6)" }}>+</span>
                <span className="wallet-quickpay-text">
                  <b>Add Funds (Paybost — Test Mode)</b>
                  <span>Add money using Paybost</span>
                </span>
              </>
            }
            onBalanceChange={setBalance}
          />
        </div>

        <div className="kk-section-head" style={{ padding: "18px 16px 8px" }}>
          <span className="kk-section-title" style={{ fontSize: 15 }}>Wallet Overview</span>
          <Link href="/transactions" className="view-all" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            View All <IconChevronRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>

        <section className="wallet-stats-grid">
          {OVERVIEW.map((s) => (
            <div className="card wallet-stat-card" key={s.key}>
              <div className="wallet-stat-icon" style={{ background: s.bg }}>
                <s.icon />
              </div>
              <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px" }}>{s.label}</span>
              <b className={s.tone}>{stats ? money(stats[s.key]) : "…"}</b>
              <span>{s.sub}</span>
              <svg className="wallet-stat-spark" viewBox="0 0 100 24" preserveAspectRatio="none">
                <polyline points={SPARK_POINTS[s.line]} fill="none" stroke={s.lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
              </svg>
            </div>
          ))}
        </section>

        <div className="kk-section-head" style={{ padding: "18px 16px 8px" }}>
          <span className="kk-section-title" style={{ fontSize: 15 }}>Quick Actions</span>
        </div>

        <div className="wallet-quick-list">
          {QUICK_ACTIONS.map((a) => (
            <Link href={a.href} className="wallet-quick-card" key={a.href}>
              <span className="kk-list-item-icon" style={{ background: a.bg, color: "#fff" }}>
                <a.icon />
              </span>
              <span className="label" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: a.color }}>{a.label}</span>
                <span style={{ fontSize: 11, color: "var(--kk-muted)", fontWeight: 400 }}>{a.sub}</span>
              </span>
              <span className="chev">
                <IconChevronRight />
              </span>
            </Link>
          ))}
        </div>

        <div className="alert alert-info" style={{ margin: "16px 16px 0" }}>
          <IconShield style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>
            <b>Demo Mode</b> — Stats above reflect your real demo-credit activity. No real money is ever involved.
          </span>
        </div>

        <footer className="kk-footer">This account and its balance are placeholders for this UI preview.</footer>
      </main>

      <BottomNav />
    </div>
  );
}
