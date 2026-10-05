"use client";

import { useEffect, useRef, useState } from "react";
import { IconShield, IconX, IconChevronRight, IconWallet, IconUpload, IconCheck } from "../icons";

// This merchant's Karopay account is used in PKR — matches this app's
// existing Rs-denominated wallet, so 1 PKR == 1 demo credit here.
const PRESET_AMOUNTS = [3000, 5000, 10000, 25000, 35000, 50000];
const MIN_AMOUNT = 3000;
const QR_MIN_AMOUNT = 100;
const MAX_AMOUNT = 50000;
const POLL_INTERVAL_MS = 2000;
const HOME_REDIRECT_DELAY_MS = 2500; // show the success message briefly, then go home
const POLL_MAX_ATTEMPTS = 45; // ~90s — wallet approvals (e.g. Easypaisa app prompt) can take a while
// Remembers the order the browser left for, so coming back without Karopay's
// redirect (Back button, reopening the app) still resumes the status check.
const PENDING_KEY = "karopay_pending_order";
const PENDING_MAX_AGE_MS = 30 * 60_000;

function readPendingOrder() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
    if (saved?.identifier && Date.now() - saved.at < PENDING_MAX_AGE_MS) return saved.identifier;
  } catch {}
  return null;
}

function clearPendingOrder() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {}
}

const HOW_IT_WORKS = [
  { step: 1, title: "Choose Amount", desc: "Select or enter the amount you want", icon: IconWallet, bg: "linear-gradient(160deg,#a855f7,#6d28d9)" },
  { step: 2, title: "Pay with Karopay", desc: "Complete the payment using Karopay", icon: null, emoji: "🚀", bg: "linear-gradient(160deg,#4aa8ff,#1565e8)" },
  { step: 3, title: "Auto Credit", desc: "Amount will be added to your wallet instantly", icon: IconUpload, bg: "linear-gradient(160deg,#4aa8ff,#1565e8)" },
  { step: 4, title: "Start Playing", desc: "Use your balance to play and enjoy", icon: IconCheck, bg: "linear-gradient(160deg,#33d19a,#1a9450)" },
];

// Wallet the user pays from — sent to Karopay as defaultChannelName
// (documented values: easypaisa, jazzcash, card, bill).
const CHANNELS = [
  { key: "easypaisa", label: "Easypaisa", logo: "/game/esy.png" },
  { key: "jazzcash", label: "JazzCash", logo: "/game/jazz.png" },
];

const formatShort = (v) => (v >= 1000 ? `${v / 1000}K` : `${v}`);

// Karopay's Collection Request is a real server-side call that returns a
// hosted checkout URL — unlike the previous gateway (a browser-submitted
// form POST with no server-side initiate call), we just navigate the
// browser straight to the payUrl it gives back. The user is redirected back
// to this same page afterwards (returnUrl), and on mount we check the URL
// for that return trip and pick up wherever the redirect left off.
// `inline` renders the form directly in the page (deposit page's Karopay tab)
// instead of a trigger button + popup.
export default function KaropayAddFunds({ theme = "dark", triggerClassName, triggerLabel = "Add Funds (Karopay)", onBalanceChange, disabled = false, inline = false }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [channel, setChannel] = useState("easypaisa");
  const [phase, setPhase] = useState("select"); // select | redirecting | polling | success | error
  const [resultMessage, setResultMessage] = useState("");
  const [resultBalance, setResultBalance] = useState(null);
  const pollRef = useRef(null);

  const boxClass = theme === "light" ? "kk-popup-box" : "popup-box";
  const textClass = theme === "light" ? "kk-popup-text" : "popup-text";
  const btnClass = theme === "light" ? "kk-popup-btn" : "popup-btn";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const karopayResult = params.get("karopay");

    const resume = (identifier) => {
      clearTimeout(pollRef.current);
      setOpen(true);
      setPhase("polling");
      pollStatus(identifier, 0);
    };

    if (karopayResult) {
      // Strip the query params so a page refresh doesn't re-trigger this.
      const url = new URL(window.location.href);
      url.searchParams.delete("karopay");
      url.searchParams.delete("identifier");
      window.history.replaceState({}, "", url.toString());

      const identifier = params.get("identifier");
      if (karopayResult === "return" && identifier) resume(identifier);
    } else {
      // Karopay didn't redirect back (Back button / reopened app) — pick up
      // the order the browser left for, if it's recent.
      const pending = readPendingOrder();
      if (pending) resume(pending);
    }

    // The Back button can restore this page from the bfcache without
    // re-running effects, so resume from there too.
    const onPageShow = (e) => {
      if (!e.persisted) return;
      const pending = readPendingOrder();
      if (pending) resume(pending);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(pollRef.current), []);

  const pollStatus = async (identifier, attempt) => {
    try {
      const res = await fetch(`/api/karopay/status?identifier=${encodeURIComponent(identifier)}`);
      const data = await res.json();
      if (res.ok && data.status === "COMPLETED") {
        clearPendingOrder();
        setPhase("success");
        setResultBalance(data.balance);
        onBalanceChange?.(data.balance);
        // Karopay deposits are credited automatically — send the user back to
        // the home page, which loads the updated balance fresh.
        pollRef.current = setTimeout(() => window.location.assign("/"), HOME_REDIRECT_DELAY_MS);
        return;
      }
      if (res.ok && ["FAILED", "CANCELLED", "REFUNDED"].includes(data.status)) {
        clearPendingOrder();
        setPhase("error");
        setResultMessage("Payment did not complete — no funds were added to your virtual wallet.");
        return;
      }
      if ([401, 403, 404].includes(res.status)) {
        clearPendingOrder();
        setPhase("error");
        setResultMessage(data.error || "Could not find this payment.");
        return;
      }
    } catch {
      // keep polling — a transient network error shouldn't give up early
    }

    if (attempt + 1 >= POLL_MAX_ATTEMPTS) {
      setPhase("error");
      setResultMessage(
        "Still waiting on confirmation from Karopay. If your balance doesn't update in a minute, this payment likely wasn't completed."
      );
      return;
    }
    pollRef.current = setTimeout(() => pollStatus(identifier, attempt + 1), POLL_INTERVAL_MS);
  };

  const reset = () => {
    setPhase("select");
    setResultMessage("");
    setResultBalance(null);
    clearTimeout(pollRef.current);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const pickAmount = (v) => setAmount(v);

  const handleManualChange = (e) => {
    const v = e.target.value;
    setAmount(v === "" ? null : Number(v) || 0);
  };

  const minimumAmount = channel === "easypaisa" ? QR_MIN_AMOUNT : MIN_AMOUNT;
  const canSubmit = amount && amount >= minimumAmount && amount <= MAX_AMOUNT && /^03\d{9}$/.test(customerPhone);

  const handlePay = async () => {
    setPhase("redirecting");
    try {
      const res = await fetch("/api/karopay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, customerPhone, channel }),
      });
      const data = await res.json();
      console.log("Karopay create-order responsvvve:",res, data);
      if (!res.ok || !data.payUrl) {
        setPhase("error");
        setResultMessage(data.error || "Could not start Karopay checkout.");
        return;
      }
      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify({ identifier: data.identifier, at: Date.now() }));
      } catch {}
      window.location.href = data.payUrl;
    } catch {
      setPhase("error");
      setResultMessage("Could not start Karopay checkout. Please try again.");
    }
  };

  const content = (
    <>
          {phase === "select" && (
            <>
              {!inline && (
                <>
                  <div className="kk-popup-title paybost-title">Add Funds via Karopay</div>
                  <p className={textClass}>Add funds instantly using Karopay.</p>
                </>
              )}

              <div className="deposit-amount-head" style={{ marginTop: inline ? 0 : 14 }}>
                <span className="deposit-amount-icon">
                  <IconWallet />
                </span>
                <h2>Add funds amount</h2>
              </div>

              <div className="deposit-amount-grid">
                {PRESET_AMOUNTS.map((v) => (
                  <button
                    type="button"
                    key={v}
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
                  id="karopay-custom-input"
                  type="number"
                  inputMode="decimal"
                  min={minimumAmount}
                  max={MAX_AMOUNT}
                  step="0.01"
                  placeholder={`Rs${minimumAmount.toLocaleString()}.00 - Rs${MAX_AMOUNT.toLocaleString()}.00`}
                  style={{ fontWeight: 500 }}
                  value={amount ?? ""}
                  onChange={handleManualChange}
                />
                {amount != null && (
                  <button type="button" className="inputbar-clear" aria-label="Clear amount" onClick={() => setAmount(null)}>
                    <IconX />
                  </button>
                )}
              </div>

              <div className="paybost-min-max">
                Minimum Rs{minimumAmount.toLocaleString()} &nbsp;|&nbsp; Maximum Rs{MAX_AMOUNT.toLocaleString()}
              </div>

              <div className="deposit-step-head" style={{ marginTop: 16 }}>
                <div>
                  <h2>Payment Method</h2>
                  <p>Choose one</p>
                </div>
              </div>
              <div className="deposit-method-grid">
                {CHANNELS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={`deposit-method-card ${channel === c.key ? "selected" : ""}`}
                    onClick={() => setChannel(c.key)}
                  >
                    <img src={c.logo} alt={c.label} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              <div className="deposit-number-input-box" style={{ marginTop: 12 }}>
                <span>Your {CHANNELS.find((c) => c.key === channel)?.label} Number</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="03XXXXXXXXX"
                  maxLength={11}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <button
                type="button"
                className="deposit-submit-btn"
                style={{ marginTop: 16, width: "95%" }}
                disabled={!canSubmit}
                onClick={handlePay}
              >
                🚀 Pay Rs{amount || 0} with Karopay
                <IconChevronRight style={{ width: 16, height: 16 }} />
              </button>
              <div className="paybost-how-card">
                <div className="paybost-how-head">
                  <IconShield style={{ width: 15, height: 15, color: "var(--link)" }} />
                  How Karopay Works
                </div>
                <div className="paybost-how-steps">
                  {HOW_IT_WORKS.map((s, i) => (
                    <div className="paybost-how-step" key={s.step}>
                      <div className="paybost-how-icon" style={{ background: s.bg }}>
                        {s.icon ? <s.icon /> : s.emoji}
                      </div>
                      <b>{s.step}. {s.title}</b>
                      <span>{s.desc}</span>
                      {i < HOW_IT_WORKS.length - 1 && <span className="paybost-how-arrow">→</span>}
                    </div>
                  ))}
                </div>
              </div>

              {!inline && (
                <button type="button" className="paybost-cancel-btn" onClick={close}>
                  Cancel
                </button>
              )}
            </>
          )}

          {phase === "redirecting" && <div className={textClass} style={{ marginTop: 16 }}>Redirecting you to Karopay…</div>}

          {phase === "polling" && (
            <div className={textClass} style={{ marginTop: 16 }}>Confirming your payment with Karopay…</div>
          )}

          {phase === "success" && (
            <>
              <div className={textClass} style={{ marginTop: 16, color: "#37f59a", fontWeight: 800 }}>
                Success! Your balance is now Rs{Number(resultBalance).toLocaleString()}. Taking you home…
              </div>
              <button className={btnClass} onClick={() => window.location.assign("/")}>
                Done
              </button>
            </>
          )}

          {phase === "error" && (
            <>
              <div className={textClass} style={{ marginTop: 16, color: "#ff5c5c" }}>
                {resultMessage || "Payment Failed — no funds were added to your wallet."}
              </div>
              <button className={btnClass} onClick={reset}>
                Try again
              </button>
            </>
          )}
    </>
  );

  if (inline) {
    return <div className="karopay-inline">{content}</div>;
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)} disabled={disabled}>
        {triggerLabel}
      </button>

      <div className={`popup ${open ? "active" : ""}`} onClick={phase === "polling" ? undefined : close}>
        <div className={`${boxClass} paybost-modal`} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="paybost-close-btn" onClick={close} aria-label="Close">
            <IconX />
          </button>

          {content}
        </div>
      </div>
    </>
  );
}
