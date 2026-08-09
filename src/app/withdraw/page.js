"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";

const amountOptions = [500, 1000, 5000, 7000, 10000, 15000, 25000, 50000];
const methodOptions = [
  { key: "wallet-a", label: "QuickPay Wallet", icon: "📱" },
  { key: "wallet-b", label: "SwiftPay Wallet", icon: "💳" },
];

export default function WithdrawPage() {
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState("wallet-a");
  const [account, setAccount] = useState("");
  const [popup, setPopup] = useState(null);

  const openNotice = (msg) => setPopup(msg);
  const closeNotice = () => setPopup(null);

  const handleAmountPick = (value) => setAmount(value);

  const handleManualChange = (e) => {
    const value = e.target.value;
    setAmount(value === "" ? "" : Number(value));
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount < 500) {
      openNotice("Minimum withdraw amount is 500.");
      return;
    }
    if (!account.trim()) {
      openNotice("Please enter your account number.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method, accountNumber: account }),
      });
      const data = await res.json();
      if (!res.ok) {
        openNotice(data.error || "Failed to submit withdraw request.");
        return;
      }
      openNotice("Withdraw request submitted. It will be processed once approved by an admin.");
    } catch {
      openNotice("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell auth-page">
      <div className="app-glow g1" />
      <div className="app-glow g2" />
      <div className="app-glow g3" />

      <header className="topbar">
        <Link href="/" className="brand-logo">
          <div className="brand-mark">DA</div>
          <div className="brand-copy">
            <b>Demo Arcade</b>
            <span>UI Showcase</span>
          </div>
        </Link>
        <div className="demo-pill">
          <span>🧪</span> Demo mode
        </div>
      </header>

      <main className="content">
        <section className="deposit-hero">
          <div className="deposit-kicker">✦ WITHDRAW DEMO</div>
          <h1 className="deposit-title">
            Cash Out
            <br />
            <span>Preview Only</span>
          </h1>
          <p className="deposit-sub">
            This screen previews a withdraw UI for the showcase. No real payout is ever
            issued and no real account is debited.
          </p>

          <div className="secure-strip">
            <div className="secure-pill">
              <span>🧩</span>
              <b>Static</b>
              <span>Demo layout</span>
            </div>
            <div className="secure-pill">
              <span>🪙</span>
              <b>Play</b>
              <span>Coins only</span>
            </div>
            <div className="secure-pill">
              <span>🚫</span>
              <b>No</b>
              <span>Real payouts</span>
            </div>
          </div>
        </section>

        <section className="deposit-card">
          <div className="card-title">
            <h2>Select Amount</h2>
            <span>Play coins</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="amount-grid">
              {amountOptions.map((value) => (
                <label className="amount-option" key={value}>
                  <input
                    type="radio"
                    name="withdraw_amount_option"
                    checked={amount === value}
                    onChange={() => handleAmountPick(value)}
                  />
                  <div className="amount-box">
                    <div className="coin-icon">🪙</div>
                    <div>
                      <b>{value.toLocaleString()}</b>
                      <span>Coins</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="manual-box">
              <div className="manual-label">
                Manual Amount
                <span>Minimum 500</span>
              </div>
              <input
                type="number"
                min="500"
                step="1"
                className="manual-input"
                placeholder="Enter custom amount"
                value={amount}
                onChange={handleManualChange}
              />
            </div>

            <div className="card-title" style={{ marginTop: 18, marginBottom: 12 }}>
              <h2>Payout Method</h2>
              <span>Choose one</span>
            </div>

            <div className="method-grid">
              {methodOptions.map((m) => (
                <label className="method-option" key={m.key}>
                  <input
                    type="radio"
                    name="withdraw_method"
                    checked={method === m.key}
                    onChange={() => setMethod(m.key)}
                  />
                  <div className="method-card">
                    <span>{m.icon}</span>
                    {m.label}
                  </div>
                </label>
              ))}
            </div>

            <input
              type="text"
              placeholder="Demo account number"
              className="phone-input"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />

            <button type="submit" className="deposit-submit" disabled={submitting}>
              💸 {submitting ? "Submitting…" : `Withdraw ${amount ? Number(amount).toLocaleString() : 0}`}
            </button>
          </form>
        </section>

        <div className="min-note">
          ✅ Demo only — no real payout is ever issued. This screen exists purely to
          showcase the withdraw UI layout.
        </div>

        <footer className="footer" style={{ marginBottom: 24 }}>
          This page is a <b>UI/UX demo</b>. It does not process withdrawals and is not
          connected to any real payment gateway or gambling product.
        </footer>
      </main>

      <BottomNav onPlayClick={() => openNotice("This is a static UI demo — no real game session starts here.")} />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeNotice}>
        <div className="popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon">🧪</div>
          <div className="popup-title">Demo Mode</div>
          <p className="popup-text">{popup}</p>
          <button className="popup-btn" onClick={closeNotice}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
