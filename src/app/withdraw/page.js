"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconChevronLeft,
  IconChevronRight,
  IconShield,
  IconWithdraw,
  IconGlobe,
} from "../icons";
import BottomNav from "../components/BottomNav";

const QUICK_AMOUNTS = [500, 1000, 5000, 10000];
const MIN_WITHDRAW = 500;

const PAYMENT_METHODS = [
  { key: "jazzcash", label: "JazzCash", logo: "/game/jazz.png" },
  { key: "easypaisa", label: "Easypaisa", logo: "/game/esy.png" },
];

// Kept in sync with ELIGIBILITY_MESSAGES in /api/withdraw — this is only the
// proactive, pre-submit copy; the backend is the real authority and returns
// the same messages if this check is ever bypassed.
const ELIGIBILITY_MESSAGES = {
  pending_deposit: "Your deposit is still pending verification. You can withdraw once it's approved.",
  no_deposit: "You'll need a verified deposit before you can withdraw. Please make a deposit first.",
};

export default function WithdrawPage() {
  const router = useRouter();
  const [tab, setTab] = useState("manual");
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(500);
  const [customMode, setCustomMode] = useState(false);
  const [methods, setMethods] = useState(null); // [{ key, label, enabled }] from admin settings
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [senderNumber, setSenderNumber] = useState("");
  const [paybostAccount, setPaybostAccount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);
  const [eligible, setEligible] = useState(true); // optimistic until the check resolves

  const openNotice = (msg, tone = "info") => setPopup({ msg, tone });
  const closeNotice = () => setPopup(null);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBalance(data.balance))
      .catch(() => router.push("/login"));
    fetch("/api/support-settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        // Withdraw methods are advertised independently of deposit methods —
        // a method can be on for deposits but off for withdrawals or vice versa.
        const list = data.withdrawMethods || [];
        setMethods(list);
        const firstEnabled = PAYMENT_METHODS.find((m) => list.find((x) => x.key === m.key)?.enabled);
        if (firstEnabled) setSelectedMethod(firstEnabled.key);
      })
      .catch(() => setMethods([]));
    fetch("/api/withdraw/eligibility")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setEligible(data.eligible);
        if (!data.eligible) openNotice(ELIGIBILITY_MESSAGES[data.reason], "error");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const pickAmount = (v) => {
    setAmount(v);
    setCustomMode(false);
  };

  const isMethodEnabled = (key) => methods?.find((m) => m.key === key)?.enabled;
  const paybostEnabled = isMethodEnabled("paybost");

  const handleSubmit = async () => {
    if (!eligible) {
      openNotice("You're not eligible to withdraw yet.", "error");
      return;
    }
    if (!amount || amount < MIN_WITHDRAW) {
      openNotice(`Minimum withdraw is Rs${MIN_WITHDRAW}.`, "error");
      return;
    }

    let methodLabel;
    let accountNumber;
    if (tab === "manual") {
      if (!selectedMethod || !isMethodEnabled(selectedMethod)) {
        openNotice("Please choose a payout method.", "error");
        return;
      }
      if (!senderNumber.trim()) {
        openNotice("Please enter the account number to receive your payout.", "error");
        return;
      }
      methodLabel = PAYMENT_METHODS.find((m) => m.key === selectedMethod)?.label || selectedMethod;
      accountNumber = senderNumber.trim();
    } else {
      if (!paybostEnabled) {
        openNotice("Paybost payouts are currently unavailable.", "error");
        return;
      }
      if (!paybostAccount.trim()) {
        openNotice("Please enter your Paybost account number.", "error");
        return;
      }
      methodLabel = "Paybost";
      accountNumber = paybostAccount.trim();
    }

    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: methodLabel, accountNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        openNotice(data.error || "Failed to submit withdraw request.", "error");
        return;
      }
      setSenderNumber("");
      setPaybostAccount("");
      setBalance(data.balance);
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

  const amountStep = (
    <section className="deposit-step-card">
      <div className="deposit-step-head">
        <span className="deposit-step-num">1</span>
        <div>
          <h2>Enter Amount</h2>
          <p>Enter the amount you want to withdraw</p>
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
            min={MIN_WITHDRAW}
            value={amount}
            onChange={(e) => {
              setCustomMode(true);
              setAmount(Number(e.target.value) || 0);
            }}
          />
        </div>
      </div>
      <div className="deposit-min-hint">Minimum withdraw: Rs{MIN_WITHDRAW}</div>
    </section>
  );

  const safetyCard = (
    <section className="deposit-safety-card">
      <div className="deposit-info-head">
        <span className="deposit-info-icon success">
          <IconShield />
        </span>
        <h2>Your Money is Safe</h2>
      </div>
      <ul className="deposit-safety-list">
        <li>🔒 SSL Encrypted</li>
        <li>✏️ Fast Review</li>
        <li>🕐 24/7 Support</li>
        <li>💰 Secure Transactions</li>
      </ul>
    </section>
  );

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <div style={{ textAlign: "center" }}>
          <span className="kk-header-title" style={{ display: "block" }}>Withdraw</span>
          <span style={{ fontSize: 11, color: "var(--kk-muted)" }}>Cash out your demo credits</span>
        </div>
        <span className="badge-pill badge-info">
          <IconShield style={{ width: 11, height: 11 }} />
          100% Secure
        </span>
      </header>

      <main>
        <section className="kk-wallet-banner wallet-hero">
          <IconWithdraw className="wallet-hero-watermark" />
          <div className="kk-wallet-label-row">
            <span>CURRENT BALANCE</span>
          </div>
          <div className="kk-wallet-balance">Rs{Number(balance).toFixed(2)}</div>
          <div className="kk-wallet-balance-label">Available to use</div>
        </section>

        <div className="deposit-tabs">
          <button className={`deposit-tab ${tab === "manual" ? "active" : ""}`} onClick={() => setTab("manual")}>
            <span className="deposit-tab-icon blue">
              <IconWithdraw />
            </span>
            <span>
              <b>Manual Withdraw</b>
              <span>Withdraw manually</span>
            </span>
          </button>
          <button
            className={`deposit-tab ${tab === "paybost" ? "active" : ""} ${!paybostEnabled ? "disabled" : ""}`}
            onClick={() => paybostEnabled && setTab("paybost")}
            disabled={!paybostEnabled}
          >
            <span className="deposit-tab-icon purple">🚀</span>
            <span>
              <b>Withdraw via Paybost</b>
              <span>{paybostEnabled ? "Payout via Paybost" : "Currently unavailable"}</span>
            </span>
          </button>
        </div>

        {tab === "manual" ? (
          <div className="deposit-grid-2col">
            <div className="deposit-main-col">
              {amountStep}

              <section className="deposit-step-card">
                <div className="deposit-step-head">
                  <span className="deposit-step-num">2</span>
                  <div>
                    <h2>Payout Method</h2>
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

              <button className="deposit-submit-btn" onClick={handleSubmit} disabled={submitting || !eligible}>
                {submitting ? "Submitting…" : "Withdraw"} {!submitting && `Rs${amount ? Number(amount).toLocaleString() : 0}`}
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
                  <li>Funds are held from your balance the moment you submit</li>
                  <li>Held funds are refunded automatically if an admin rejects the request</li>
                  <li>Your withdrawal will be reviewed within minutes</li>
                </ul>
              </section>
            </div>

            <div className="deposit-side-col">
              <div className="alert alert-info">
                <IconShield style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>
                  <b>Note</b> — Make sure the account belongs to you. Third-party payouts are not accepted.
                </span>
              </div>
              {safetyCard}
            </div>
          </div>
        ) : (
          <div className="deposit-grid-2col">
            <div className="deposit-main-col">
              {amountStep}

              <section className="deposit-step-card">
                <div className="deposit-step-head">
                  <span className="deposit-step-num">2</span>
                  <div>
                    <h2>Paybost Account</h2>
                    <p>Where should we send your payout</p>
                  </div>
                </div>
                <div className="deposit-number-input-box">
                  <span>Your Paybost Account Number</span>
                  <input
                    type="text"
                    placeholder="Enter your Paybost account number"
                    value={paybostAccount}
                    onChange={(e) => setPaybostAccount(e.target.value)}
                  />
                </div>
              </section>

              <button className="deposit-submit-btn" onClick={handleSubmit} disabled={submitting || !eligible}>
                {submitting ? "Submitting…" : "Withdraw"} {!submitting && `Rs${amount ? Number(amount).toLocaleString() : 0}`}
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
                  <li>Funds are held from your balance the moment you submit</li>
                  <li>Held funds are refunded automatically if an admin rejects the request</li>
                  <li>Your withdrawal will be reviewed within minutes</li>
                </ul>
              </section>
            </div>

            <div className="deposit-side-col">{safetyCard}</div>
          </div>
        )}

        <div className="deposit-help-footer">
          <span>
            <IconGlobe style={{ width: 16, height: 16 }} />
            <b>Need Help?</b>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--kk-muted)", marginTop: 2 }}>
              If you face any issues with withdrawal, please contact our support.
            </span>
          </span>
          <Link href="/support" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Contact Support
          </Link>
        </div>

        <footer className="kk-footer">
          PK92 is an educational simulation using demo credits only — no real money or payout is
          ever issued. See our <Link href="/legal/terms">Terms</Link> and{" "}
          <Link href="/legal/withdrawal-policy">Withdrawal Policy</Link>.
        </footer>
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeNotice}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">{popup?.tone === "success" ? "✅" : popup?.tone === "error" ? "⚠️" : "🧪"}</div>
          <div className="kk-popup-title">
            {popup?.tone === "success" ? "Withdrawal Request Submitted" : popup?.tone === "error" ? "Couldn't Submit" : "Demo Mode"}
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
