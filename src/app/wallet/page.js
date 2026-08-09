"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconChevronLeft, IconDeposit, IconWithdraw, IconHistory, IconTrendingUp, IconTrophy } from "../icons";
import BottomNav from "../components/BottomNav";
import PayPalAddFunds from "../components/PayPalAddFunds";
import PaybostAddFunds from "../components/PaybostAddFunds";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBalance(data.balance))
      .catch(() => {});
    fetch("/api/wallet/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const money = (n) => `Rs${Number(n ?? 0).toLocaleString()}`;

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">Wallet</span>
        <span className="kk-header-side" />
      </header>

      <main>
        <section className="kk-wallet-banner">
          <div className="kk-wallet-toggle" />
          <div className="kk-wallet-balance">Rs{Number(balance).toFixed(2)}</div>
          <div className="kk-wallet-balance-label">Total balance</div>
        </section>

        <PayPalAddFunds
          theme="dark"
          triggerClassName="kk-transfer-btn"
          triggerLabel="➕ Add Funds (PayPal Sandbox)"
          onBalanceChange={setBalance}
        />

        <PaybostAddFunds
          theme="dark"
          triggerClassName="kk-transfer-btn"
          triggerLabel="➕ Add Funds (Paybost — Test Mode)"
          onBalanceChange={setBalance}
        />

        <section className="wallet-stats-grid">
          <div className="card wallet-stat-card">
            <div className="wallet-stat-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
              <IconDeposit />
            </div>
            <b>{stats ? money(stats.totalDeposited) : "…"}</b>
            <span>Total deposited</span>
          </div>
          <div className="card wallet-stat-card">
            <div className="wallet-stat-icon" style={{ background: "linear-gradient(160deg,#ff6b8f,#d6296a)" }}>
              <IconWithdraw />
            </div>
            <b>{stats ? money(stats.totalWithdrawn) : "…"}</b>
            <span>Total withdrawn</span>
          </div>
          <div className="card wallet-stat-card">
            <div className="wallet-stat-icon" style={{ background: "linear-gradient(160deg,#4aa8ff,#1565e8)" }}>
              <IconTrendingUp />
            </div>
            <b>{stats ? money(stats.gameWagered) : "…"}</b>
            <span>Game wagered</span>
          </div>
          <div className="card wallet-stat-card">
            <div className="wallet-stat-icon" style={{ background: "linear-gradient(160deg,#f2ab13,#c97a06)" }}>
              <IconTrophy />
            </div>
            <b>{stats ? money(stats.gameWon) : "…"}</b>
            <span>Game won</span>
          </div>
        </section>

        <section className="kk-action-grid">
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
          <Link href="/transactions?type=deposit" className="kk-action">
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#ff6b8f,#d6296a)" }}>
              <IconHistory />
            </div>
            <span>Deposit history</span>
          </Link>
          <Link href="/transactions?type=withdraw" className="kk-action">
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
              <IconHistory />
            </div>
            <span>Withdrawal history</span>
          </Link>
        </section>

        <footer className="kk-footer">Stats above reflect your real demo-credit activity. No real money is ever involved.</footer>
      </main>

      <BottomNav />
    </div>
  );
}
