"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import AppShellHeader from "../components/AppShellHeader";

const amountOptions = [500, 1000, 5000, 7000, 10000, 15000, 25000, 50000];
const methodOptions = [
  { key: "mobile-wallet", label: "Mobile Wallet", icon: "📱" },
  { key: "bank-transfer", label: "Bank Transfer", icon: "💳" },
];

export default function WithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState("mobile-wallet");
  const [account, setAccount] = useState("");
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .catch(() => router.push("/login"));
  }, [router]);

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
    if (!amount || amount < 500) {
      openNotice("Minimum withdraw amount is 500.", "error");
      return;
    }
    if (!account.trim()) {
      openNotice("Please enter your account number.", "error");
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
        openNotice(data.error || "Failed to submit withdraw request.", "error");
        return;
      }
      openNotice(
        `Withdrawal request for Rs${amount.toLocaleString()} submitted — the amount is held from your balance now. It'll be processed once an admin reviews it.`,
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
              <div className="deposit-kicker">✦ CASH OUT DEMO CREDITS</div>
              <h1 className="deposit-title compact">
                Withdraw <span>Demo Credits</span>
              </h1>
              <p className="deposit-sub">
                Submit a withdrawal request for admin review. Funds are held from your demo
                balance immediately — no real payout is ever issued to any real account.
              </p>
            </div>
            <div className="demo-pill">
              <span>🖊️</span> Demo Mode
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
              placeholder="Account number"
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
          ✅ Held funds are refunded automatically if an admin rejects the request. Minimum
          withdraw is Rs 500.
        </div>

        <footer className="footer" style={{ marginBottom: 24 }}>
          PK92 is an educational simulation using demo credits only — no real money or payout
          is ever issued. See our{" "}
          <Link href="/legal/terms" target="_blank" rel="noopener noreferrer">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/withdrawal-policy" target="_blank" rel="noopener noreferrer">
            Withdrawal Policy
          </Link>
          .
        </footer>
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeNotice}>
        <div className="popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon">{popup?.tone === "success" ? "✅" : popup?.tone === "error" ? "⚠️" : "🧪"}</div>
          <div className="popup-title">{popup?.tone === "success" ? "Withdrawal Submitted" : popup?.tone === "error" ? "Couldn't Submit" : "Demo Mode"}</div>
          <p className="popup-text">{popup?.msg}</p>
          <button className="popup-btn" onClick={closeNotice}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
