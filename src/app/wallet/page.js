"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconChevronLeft, IconDeposit, IconWithdraw, IconHistory } from "../icons";
import BottomNav from "../components/BottomNav";
import PayPalAddFunds from "../components/PayPalAddFunds";

export default function WalletPage() {
  const [popup, setPopup] = useState(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBalance(data.balance))
      .catch(() => {});
  }, []);

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
          theme="light"
          triggerClassName="kk-transfer-btn"
          triggerLabel="➕ Add Funds (PayPal Sandbox)"
          onBalanceChange={setBalance}
        />

        <section className="kk-wallet-card">
          <div className="kk-donut">
            <div className="kk-donut-ring" style={{ "--pct": 0 }}>
              <span>0%</span>
            </div>
            <label>Rs0.00</label>
            <label>Main wallet</label>
          </div>
          <div className="kk-donut">
            <div className="kk-donut-ring" style={{ "--pct": 0 }}>
              <span>0%</span>
            </div>
            <label>Rs0.00</label>
            <label>3rd party wallet</label>
          </div>
        </section>

        <button className="kk-transfer-btn" onClick={() => setPopup("Main wallet transfer")}>
          Main wallet transfer
        </button>

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
          <Link href="/transactions" className="kk-action">
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#ff6b8f,#d6296a)" }}>
              <IconHistory />
            </div>
            <span>Deposit history</span>
          </Link>
          <Link href="/transactions" className="kk-action">
            <div className="kk-action-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
              <IconHistory />
            </div>
            <span>Withdrawal history</span>
          </Link>
        </section>

        <section className="kk-balance-tiles">
          <button className="kk-tile light" onClick={() => setPopup("ARGame balance")}>
            <b>Rs0.00</b>
            <span>ARGame</span>
          </button>
          <button className="kk-tile blue" onClick={() => setPopup("Lottery balance")}>
            <b>Rs0.00</b>
            <span>Lottery</span>
          </button>
        </section>

        <footer className="kk-footer">All balances shown are placeholders for this UI preview.</footer>
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={() => setPopup(null)}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">💳</div>
          <div className="kk-popup-title">Demo Mode</div>
          <p className="kk-popup-text">&quot;{popup}&quot; is a placeholder in this UI showcase — no real wallet transaction happens here.</p>
          <button className="kk-popup-btn" onClick={() => setPopup(null)}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
