"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconChevronLeft,
  IconChevronRight,
  IconShield,
  IconDeposit,
  IconGlobe,
} from "../icons";
import PaybostAddFunds from "../components/PaybostAddFunds";
import BottomNav from "../components/BottomNav";

const QUICK_AMOUNTS = [3000, 5000, 10000, 20000];
const MIN_DEPOSIT = 3000;

const PAYMENT_METHODS = [
  { key: "jazzcash", label: "JazzCash", logo: "/game/jazz.png" },
  { key: "easypaisa", label: "Easypaisa", logo: "/game/esy.png" },
];

export default function DepositPage() {
  const router = useRouter();
  const [tab, setTab] = useState("manual");
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(3000);
  const [customMode, setCustomMode] = useState(false);
  const [methods, setMethods] = useState(null); // [{ key, label, enabled }] from admin settings
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [senderNumber, setSenderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    // Paybost redirects back here with ?paybost=success|cancelled — that
    // popup is owned by <PaybostAddFunds>, which only mounts on the Paybost
    // tab, so jump there first or the redirect silently does nothing.
    if (new URLSearchParams(window.location.search).has("paybost")) setTab("paybost");
  }, []);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBalance(data.balance))
      .catch(() => router.push("/login"));
    fetch("/api/support-settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const list = data.methods || [];
        setMethods(list);
        const firstEnabled = PAYMENT_METHODS.find((m) => list.find((x) => x.key === m.key)?.enabled);
        if (firstEnabled) setSelectedMethod(firstEnabled.key);
      })
      .catch(() => setMethods([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNotice = (msg, tone = "info") => setPopup({ msg, tone });
  const closeNotice = () => setPopup(null);

  const pickAmount = (v) => {
    setAmount(v);
    setCustomMode(false);
  };

  const isMethodEnabled = (key) => methods?.find((m) => m.key === key)?.enabled;
  const paybostEnabled = isMethodEnabled("paybost");
  // Manual Deposit isn't a single toggle in admin — it's "on" whenever at
  // least one of its underlying methods (JazzCash/Easypaisa) is advertised,
  // same rule the Paybost tab already follows off its own single toggle.
  const manualEnabled = methods === null || PAYMENT_METHODS.some((m) => isMethodEnabled(m.key));

  useEffect(() => {
    if (methods !== null && !manualEnabled && paybostEnabled && tab === "manual") setTab("paybost");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods, manualEnabled, paybostEnabled]);

  const handleSubmit = async () => {
    if (!amount || amount < MIN_DEPOSIT) {
      openNotice(`Minimum deposit is Rs${MIN_DEPOSIT}.`, "error");
      return;
    }
    if (!selectedMethod || !isMethodEnabled(selectedMethod)) {
      openNotice("Please choose a payment method.", "error");
      return;
    }
    if (!senderNumber.trim()) {
      openNotice("Please enter the number you sent the payment from.", "error");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const methodLabel = PAYMENT_METHODS.find((m) => m.key === selectedMethod)?.label || selectedMethod;
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: methodLabel, accountNumber: senderNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        openNotice(data.error || "Failed to submit deposit request.", "error");
        return;
      }
      setSenderNumber("");
      openNotice(
        `Deposit Request Submitted — Your ${methodLabel} deposit request has been received and is waiting for admin verification. You'll be notified once it's reviewed.`,
        "success"
      );
    } catch {
      openNotice("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <div style={{ textAlign: "center" }}>
          <span className="kk-header-title" style={{ display: "block" }}>Deposit</span>
          <span style={{ fontSize: 11, color: "var(--kk-muted)" }}>Add money to your wallet</span>
        </div>
        <span className="badge-pill badge-info">
          <IconShield style={{ width: 11, height: 11 }} />
          100% Secure
        </span>
      </header>

      <main>
        <section className="kk-wallet-banner wallet-hero">
          <IconDeposit className="wallet-hero-watermark" />
          <div className="kk-wallet-label-row">
            <span>CURRENT BALANCE</span>
          </div>
          <div className="kk-wallet-balance">Rs{Number(balance).toFixed(2)}</div>
          <div className="kk-wallet-balance-label">Available to use</div>
        </section>

        <div className="deposit-tabs">
          <button
            className={`deposit-tab ${tab === "manual" ? "active" : ""} ${!manualEnabled ? "disabled" : ""}`}
            onClick={() => manualEnabled && setTab("manual")}
            disabled={!manualEnabled}
          >
            <span className="deposit-tab-icon blue">
              <IconDeposit />
            </span>
            <span>
              <b>Manual Deposit</b>
              <span>{manualEnabled ? "Deposit manually" : "Currently unavailable"}</span>
            </span>
          </button>
          <button
            className={`deposit-tab ${tab === "paybost" ? "active" : ""} ${!paybostEnabled ? "disabled" : ""}`}
            onClick={() => paybostEnabled && setTab("paybost")}
            disabled={!paybostEnabled}
          >
            <span className="deposit-tab-icon purple">🚀</span>
            <span>
              <b>Add Funds (Paybost)</b>
              <span>{paybostEnabled ? "Instant deposit via Paybost" : "Currently unavailable"}</span>
            </span>
          </button>
        </div>

        {tab === "manual" ? (
          <div className="deposit-grid-2col">
            <div className="deposit-main-col">
              <section className="deposit-step-card">
                <div className="deposit-step-head">
                  <span className="deposit-step-num">1</span>
                  <div>
                    <h2>Enter Amount</h2>
                    <p>Enter the amount you want to deposit</p>
                  </div>
                </div>
                <div className="deposit-amount-row">
                  {QUICK_AMOUNTS.map((v) => (
                    <button key={v} className={`deposit-amount-pill ${!customMode && amount === v ? "active" : ""}`} onClick={() => pickAmount(v)}>
                      Rs{v.toLocaleString()}
                    </button>
                  ))}
                  <button className={`deposit-amount-pill ${customMode ? "active" : ""}`} onClick={() => setCustomMode(true)}>
                    Other
                  </button>
                </div>
                <div className="deposit-amount-input-box">
                  <span>Amount</span>
                  <div>
                    Rs{" "}
                    <input
                      type="number"
                      min={MIN_DEPOSIT}
                      value={customMode ? amount : amount}
                      onChange={(e) => {
                        setCustomMode(true);
                        setAmount(Number(e.target.value) || 0);
                      }}
                    />
                  </div>
                </div>
                <div className="deposit-min-hint">Minimum deposit: Rs{MIN_DEPOSIT}</div>
              </section>

              <section className="deposit-step-card">
                <div className="deposit-step-head">
                  <span className="deposit-step-num">2</span>
                  <div>
                    <h2>Payment Method</h2>
                    <p>Choose one</p>
                  </div>
                </div>
                <div className="deposit-method-grid">
                  {PAYMENT_METHODS.map((m) => {
                    const enabled = isMethodEnabled(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        className={`deposit-method-card ${selectedMethod === m.key ? "selected" : ""} ${!enabled ? "disabled" : ""}`}
                        onClick={() => enabled && setSelectedMethod(m.key)}
                        disabled={!enabled}
                      >
                        <img src={m.logo} alt={m.label} />
                        <span>{m.label}</span>
                        {!enabled && <em>Unavailable</em>}
                      </button>
                    );
                  })}
                </div>
                {selectedMethod && (
                  <div className="deposit-number-input-box">
                    <span>Your {PAYMENT_METHODS.find((m) => m.key === selectedMethod)?.label} Number</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="03XXXXXXXXX"
                      maxLength={15}
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                    />
                  </div>
                )}
              </section>

              <button className="deposit-submit-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Deposit Request"}
                <IconChevronRight style={{ width: 16, height: 16 }} />
              </button>

              <section className="deposit-step-card">
                <div className="deposit-step-head">
                  <span className="deposit-step-num">3</span>
                  <div>
                    <h2>Important Instructions</h2>
                  </div>
                </div>
                <ul className="deposit-instructions">
                  <li>Send the exact amount using your selected payment method</li>
                  <li>Keep your payment receipt until it's verified</li>
                  <li>Your deposit will be verified within minutes</li>
                </ul>
              </section>
            </div>

            <div className="deposit-side-col">
              <div className="alert alert-info">
              
                <span>
                  <b>Note</b> — Make sure to send from your own account. Third-party payments are not accepted.
                </span>
              </div>

              <section className="deposit-safety-card">
                <div className="deposit-info-head">
                  <span className="deposit-info-icon success">
                    <IconShield />
                  </span>
                  <h2>Your Money is Safe</h2>
                </div>
                <ul className="deposit-safety-list">
                  <li>🔒 SSL Encrypted</li>
                  <li>✏️ Fast Verification</li>
                  <li>🕐 24/7 Support</li>
                  <li>💰 Secure Transactions</li>
                </ul>
              </section>
            </div>
          </div>
        ) : (
          <div className="deposit-grid-2col">
            <div className="deposit-main-col">
              <section className="deposit-step-card" style={{ textAlign: "center" }}>
                <h2 style={{ marginBottom: 8 }}>Instant Deposit via Paybost</h2>
                {paybostEnabled ? (
                  <>
                    <p style={{ fontSize: 12.5, color: "var(--kk-muted)", marginBottom: 18 }}>
                      Credit demo funds instantly through Paybost&apos;s sandbox checkout — running in test mode, still
                      100% simulated, still no real money.
                    </p>
                    <PaybostAddFunds theme="light" triggerClassName="deposit-submit-btn" triggerLabel="🚀 Add Funds Instantly via Paybost" onBalanceChange={setBalance} />
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: "var(--kk-muted)" }}>
                    Paybost deposits are currently unavailable. Please use Manual Deposit instead.
                  </p>
                )}
              </section>
            </div>
            <div className="deposit-side-col">
              <section className="deposit-safety-card">
                <div className="deposit-info-head">
                  <span className="deposit-info-icon success">
                    <IconShield />
                  </span>
                  <h2>Your Money is Safe</h2>
                </div>
                <ul className="deposit-safety-list">
                  <li>🔒 SSL Encrypted</li>
                  <li>⚡ Instant Credit</li>
                  <li>🕐 24/7 Support</li>
                  <li>💰 Secure Transactions</li>
                </ul>
              </section>
            </div>
          </div>
        )}

        <div className="deposit-help-footer">
          <span>
            <IconGlobe style={{ width: 16, height: 16 }} />
            <b>Need Help?</b>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--kk-muted)", marginTop: 2 }}>
              If you face any issues with deposit, please contact our support.
            </span>
          </span>
          <Link href="/support" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Contact Support
          </Link>
        </div>

        <footer className="kk-footer">
          PK92 is an educational simulation using demo credits only — no real money or payment gateway is
          involved. See our <Link href="/legal/terms">Terms</Link> and{" "}
          <Link href="/legal/deposit-policy">Deposit Policy</Link>.
        </footer>
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeNotice}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">{popup?.tone === "success" ? "✅" : popup?.tone === "error" ? "⚠️" : "🧪"}</div>
          <div className="kk-popup-title">
            {popup?.tone === "success" ? "Deposit Request Submitted" : popup?.tone === "error" ? "Couldn't Submit" : "Demo Mode"}
          </div>
          <p className="kk-popup-text">{popup?.msg}</p>
          <button className="kk-popup-btn" onClick={closeNotice}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
