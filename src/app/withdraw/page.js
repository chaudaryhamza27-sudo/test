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
  IconX,
} from "../icons";
import BottomNav from "../components/BottomNav";

const QUICK_AMOUNTS = [500,, 5000, 10000, 15000, 25000, 50000];
const MIN_WITHDRAW = 500;
const MAX_WITHDRAW = 50000;

const formatShort = (v) => (v >= 1000 ? `${v / 1000}K` : `${v}`);
// Kept in sync with LARGE_WITHDRAW_THRESHOLD in /api/withdraw — purely
// changes the confirmation copy, the backend already sends every withdrawal
// to manual admin review regardless of amount.
const LARGE_WITHDRAW_THRESHOLD = 20000;

const PAYMENT_METHODS = [
  { key: "easypaisa", label: "Easypaisa", logo: "/game/esy.png" },
  { key: "jazzcash", label: "JazzCash", logo: "/game/jazz.png" },
];

// Kept in sync with ELIGIBILITY_MESSAGES in /api/withdraw — this is only the
// proactive, pre-submit copy; the backend is the real authority and returns
// the same messages if this check is ever bypassed.
const ELIGIBILITY_MESSAGES = {
  pending_deposit: "Your deposit is still pending verification. You can withdraw once it's approved.",
  no_deposit: "You'll need a verified deposit before you can withdraw. Please make a deposit first.",
};
const TRUST_SCORE_BLOCK_MESSAGE = "Email Not Authorized";

export default function WithdrawPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(500);
  const [methods, setMethods] = useState(null); // [{ key, label, enabled }] from admin settings
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [senderNumber, setSenderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);
  const [eligible, setEligible] = useState(true); // optimistic until the check resolves
  const [banned, setBanned] = useState(false);
  const [trustScore, setTrustScore] = useState(null);

  const openNotice = (msg, tone = "info") => setPopup({ msg, tone });
  const closeNotice = () => setPopup(null);
  const openBannedNotice = () =>
    setPopup({
      tone: "banned",
      msg: "You've been banned from withdrawing. Please contact support for help.",
    });

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBalance(data.balance))
      .catch(() => router.push("/login"));
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setBanned(Boolean(data.user?.isBanned));
        setTrustScore(data.user?.trustScore ?? 50);
      })
      .catch(() => {});
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
  };

  const isMethodEnabled = (key) => methods?.find((m) => m.key === key)?.enabled;
  // One flat list, one flow — no more "Manual" vs "Paybost" tabs. Paybost is
  // just another card in the same Payment Method grid now, same as the
  // reference design: a single "Select Payment Method" step, not two
  // differently-shaped pages behind a tab switch.
  const enabledMethods = PAYMENT_METHODS.filter((m) => isMethodEnabled(m.key));
  // If the admin has switched every withdraw method off at once, fall back
  // to showing every card instead of an empty "unavailable" state — the page
  // stays usable to look at/try, and /api/withdraw is what actually enforces
  // the disabled methods server-side. A *partial* outage (some on, some off)
  // still filters normally — this fallback only kicks in when nothing is enabled.
  const methodsToShow = enabledMethods.length > 0 ? enabledMethods : PAYMENT_METHODS;

  const handleSubmit = async () => {
    if (banned) {
      openBannedNotice();
      return;
    }
    if (trustScore === 100) {
      openNotice(TRUST_SCORE_BLOCK_MESSAGE, "trust-blocked");
      return;
    }
    if (!eligible) {
      openNotice("You're not eligible to withdraw yet.", "error");
      return;
    }
    if (!amount || amount < MIN_WITHDRAW) {
      openNotice(`Minimum withdraw is Rs${MIN_WITHDRAW}.`, "error");
      return;
    }

    if (!selectedMethod || !isMethodEnabled(selectedMethod)) {
      openNotice("Please choose a payout method.", "error");
      return;
    }
    if (!senderNumber.trim()) {
      openNotice("Please enter the account number to receive your payout.", "error");
      return;
    }
    const methodLabel = PAYMENT_METHODS.find((m) => m.key === selectedMethod)?.label || selectedMethod;
    const accountNumber = senderNumber.trim();

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
        if (data.banned) {
          openBannedNotice();
        } else {
          openNotice(data.error || "Failed to submit withdraw request.", "error");
        }
        return;
      }
      setSenderNumber("");
      setBalance(data.balance);
      openNotice(
        amount >= LARGE_WITHDRAW_THRESHOLD
          ? `Withdrawal request for Rs${amount.toLocaleString()} submitted — the amount is held from your balance now. Larger withdrawals go through additional manual review, so this may take a bit longer to process.`
          : `Withdrawal request for Rs${amount.toLocaleString()} submitted — the amount is held from your balance now. It'll be processed once an admin reviews it.`,
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
      <div className="deposit-amount-head">
        <span className="deposit-amount-icon">
          <IconWithdraw />
        </span>
        <h2>Withdraw amount</h2>
      </div>

      <div className="deposit-amount-grid">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            type="button"
            className={`deposit-amount-tile ${amount === v ? "active" : ""}`}
            onClick={() => pickAmount(v)}
          >
            <span className="tile-rs">Rs</span>
            <span className="tile-val">{formatShort(v)}</span>
          </button>
        ))}
      </div>

      <div className="deposit-amount-inputbar">
        <span className="inputbar-rs">Rs</span>
        <input
          type="number"
          inputMode="decimal"
          min={MIN_WITHDRAW}
          max={MAX_WITHDRAW}
          placeholder={`Rs${MIN_WITHDRAW.toLocaleString()}.00 - Rs${MAX_WITHDRAW.toLocaleString()}.00`}
          value={amount ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setAmount(v === "" ? null : Number(v) || 0);
          }}
        />
        {amount != null && (
          <button
            type="button"
            className="inputbar-clear"
            aria-label="Clear amount"
            onClick={() => setAmount(null)}
          >
            <IconX />
          </button>
        )}
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
    <div className="kk-page withdraw-page">
      <header className="kk-header">
        <Link href="/" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <div style={{ textAlign: "center" }}>
          <span className="kk-header-title" style={{ display: "block" }}>Withdraw</span>
          <span style={{ fontSize: 11, color: "var(--kk-muted)" }}>Request a virtual balance withdrawal</span>
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

        <div className="deposit-grid-2col">
          <div className="deposit-main-col">
            <section className="deposit-step-card">
              <div className="deposit-step-head">
                <span className="deposit-step-num">1</span>
                <div>
                  <h2>Payment Method</h2>
                  <p>Choose one</p>
                </div>
              </div>
              <div className="deposit-method-grid">
                {methodsToShow.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className={`deposit-method-card ${selectedMethod === m.key ? "selected" : ""}`}
                    onClick={() => setSelectedMethod(m.key)}
                  >
                    <img src={m.logo} alt={m.label} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {amountStep}

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

            <button className="deposit-submit-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Withdraw"} {!submitting && `Rs${amount ? Number(amount).toLocaleString() : 0}`}
              <IconChevronRight style={{ width: 16, height: 16 }} />
            </button>

            <section className="deposit-step-card">
              <div className="deposit-step-head">
                <span className="deposit-step-num">2</span>
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
          PK92 is an educational simulation using virtual funds only — no real money or payout is
          ever issued. See our <Link href="/legal/terms">Terms</Link> and{" "}
          <Link href="/legal/withdrawal-policy">Withdrawal Policy</Link>.
        </footer>
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeNotice}>
        <div className={`kk-popup-box ${popup?.tone === "trust-blocked" ? "withdraw-trust-popup" : ""}`} onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">
            {popup?.tone === "trust-blocked"
              ? null
              : popup?.tone === "success"
              ? "✅"
              : popup?.tone === "banned"
              ? "🚫"
              : popup?.tone === "error"
              ? "⚠️"
              : "🧪"}
          </div>
          <div className="kk-popup-title">
            {popup?.tone === "success"
              ? "Withdrawal Request Submitted"
              : popup?.tone === "trust-blocked"
              ? "Withdraw Not Approved"
              : popup?.tone === "banned"
              ? "You're Banned"
              : popup?.tone === "error"
              ? "Couldn't Submit"
              : "Practice Mode"}
          </div>
          <p className="kk-popup-text">{popup?.msg}</p>
          {popup?.tone === "banned" ? (
            <button className="kk-popup-btn" onClick={() => router.push("/support")}>
              Contact Support
            </button>
          ) : (
            <button className="kk-popup-btn" onClick={closeNotice}>
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
