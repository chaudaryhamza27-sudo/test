"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";
import AppShellHeader from "../components/AppShellHeader";
import PayPalAddFunds from "../components/PayPalAddFunds";
import PaybostAddFunds from "../components/PaybostAddFunds";

const amountOptions = [3000, 5000, 7500, 10000, 25000, 50000];
const methodOptions = [
  { key: "mobile-wallet", label: "Mobile Wallet", icon: "📱" },
  { key: "bank-transfer", label: "Bank Transfer", icon: "💳" },
];

export default function DepositPage() {
  const [amount, setAmount] = useState(3000);
  const [method, setMethod] = useState("mobile-wallet");
  const [phone, setPhone] = useState("");
  const [popup, setPopup] = useState(null);

  // tone determines the popup's title/icon so a real success or error
  // message doesn't get mislabeled "Demo Mode" (that title is reserved for
  // genuine informational placeholders, not real outcomes of a real request).
  const openNotice = (msg, tone = "info") => setPopup({ msg, tone });
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
      openNotice("Minimum deposit amount is Rs 3,000.", "error");
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
        openNotice(data.error || "Failed to submit deposit request.", "error");
        return;
      }
      openNotice(
        `Deposit request for Rs${amount.toLocaleString()} submitted. It's now pending — check Transaction History, and your balance will update once an admin approves it.`,
        "success"
      );
    } catch {
      openNotice("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-glow g1" />
      <div className="app-glow g2" />
      <div className="app-glow g3" />

      <AppShellHeader subtitle="Aviator — Simulation" />

      <main className="content app-page-content">
        <section className="deposit-hero compact">
          <div className="deposit-hero-row">
            <div>
              <div className="deposit-kicker">✦ ADD DEMO CREDITS</div>
              <h1 className="deposit-title compact">
                Top Up <span>Your Wallet</span>
              </h1>
              <p className="deposit-sub">
                Add demo credits instantly via a sandbox payment, or submit a manual request for
                admin review. Every credit here is simulated — no real money ever moves.
              </p>
            </div>
            <div className="demo-pill">
              <span>🖊️</span> Demo Mode
            </div>
          </div>
        </section>

        <div className="deposit-instant-grid" id="deposit-options">
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

          <section className="deposit-card" style={{ textAlign: "center" }}>
            <div className="card-title">
              <h2>Instant Option</h2>
              <span>Paybost — Test Mode</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Credit demo funds instantly through Paybost&apos;s sandbox checkout. Running in test mode —
              still 100% simulated, still no real money.
            </p>
            <PaybostAddFunds theme="dark" triggerClassName="deposit-submit" triggerLabel="⚡ Add Funds Instantly via Paybost (Test Mode)" />
          </section>
        </div>

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
          ✅ Manual requests are reviewed by an admin before your balance updates. Minimum
          deposit is Rs 3,000.
        </div>

        <footer className="footer" style={{ marginBottom: 24 }}>
          PK92 is an educational simulation using demo credits only — no real money or payment
          gateway is involved. See our{" "}
          <Link href="/legal/terms" target="_blank" rel="noopener noreferrer">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/deposit-policy" target="_blank" rel="noopener noreferrer">
            Deposit Policy
          </Link>
          .
        </footer>
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeNotice}>
        <div className="popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon">{popup?.tone === "success" ? "✅" : popup?.tone === "error" ? "⚠️" : "🧪"}</div>
          <div className="popup-title">{popup?.tone === "success" ? "Deposit Submitted" : popup?.tone === "error" ? "Couldn't Submit" : "Demo Mode"}</div>
          <p className="popup-text">{popup?.msg}</p>
          <button className="popup-btn" onClick={closeNotice}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
