"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";
import PayPalAddFunds from "../components/PayPalAddFunds";

const amountOptions = [3000, 5000, 7500, 10000, 25000, 50000];
const methodOptions = [
  { key: "wallet-a", label: "QuickPay Wallet", icon: "📱" },
  { key: "wallet-b", label: "SwiftPay Wallet", icon: "💳" },
];

export default function DepositPage() {
  const [amount, setAmount] = useState(3000);
  const [method, setMethod] = useState("wallet-a");
  const [phone, setPhone] = useState("");
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
    if (!amount || amount < 3000) {
      openNotice("Minimum deposit amount is Rs 3,000.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method, accountNumber: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        openNotice(data.error || "Failed to submit deposit request.");
        return;
      }
      openNotice("Deposit request submitted. It will be credited once approved by an admin.");
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
          <div className="deposit-kicker">✦ DEPOSIT DEMO</div>
          <h1 className="deposit-title">
            Play Coins
            <br />
            <span>Top Up Preview</span>
          </h1>
          <p className="deposit-sub">
            This screen previews a deposit UI for the showcase. No real payment provider is
            connected — nothing here moves real money.
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
              <span>Real payments</span>
            </div>
          </div>
        </section>

        <section className="deposit-card" style={{ textAlign: "center" }}>
          <div className="card-title">
            <h2>Instant Option</h2>
            <span>PayPal Sandbox</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
            Skip the admin approval wait — credit demo funds instantly through a PayPal Sandbox
            test payment. Still 100% simulated, still no real money.
          </p>
          <PayPalAddFunds theme="dark" triggerClassName="deposit-submit" triggerLabel="⚡ Add Funds Instantly via PayPal Sandbox" />
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
                    name="amount_option"
                    checked={amount === value}
                    onChange={() => handleAmountPick(value)}
                  />
                  <div className="amount-box">
                    <div className="coin-icon">🪙</div>
                    <div>
                      <b>{value.toLocaleString()}</b>
                      <span>Coins Package</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="manual-box">
              <div className="manual-label">
                Manual Amount
                <span>Minimum 3,000</span>
              </div>
              <input
                type="number"
                min="3000"
                step="1"
                className="manual-input"
                placeholder="Enter custom amount"
                value={amount}
                onChange={handleManualChange}
              />
            </div>

            <div className="card-title" style={{ marginTop: 18, marginBottom: 12 }}>
              <h2>Payment Method</h2>
              <span>Choose one</span>
            </div>

            <div className="method-grid">
              {methodOptions.map((m) => (
                <label className="method-option" key={m.key}>
                  <input
                    type="radio"
                    name="method"
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
              type="tel"
              inputMode="numeric"
              maxLength={13}
              placeholder="03XXXXXXXXX"
              className="phone-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button type="submit" className="deposit-submit" disabled={submitting}>
              🪙 {submitting ? "Submitting…" : `Deposit ${amount ? Number(amount).toLocaleString() : 0}`}
            </button>
          </form>
        </section>

        <div className="min-note">
          ✅ Demo only — minimum amount is enforced purely for layout purposes. No real
          transaction is ever created.
        </div>

        <footer className="footer" style={{ marginBottom: 24 }}>
          This page is a <b>UI/UX demo</b>. It does not process payments and is not
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
