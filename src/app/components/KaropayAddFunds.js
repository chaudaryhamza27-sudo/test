"use client";

import { useEffect, useRef, useState } from "react";
import { IconShield, IconX, IconChevronRight, IconWallet, IconUpload, IconCheck } from "../icons";

// This merchant's Karopay account is used in PKR — matches this app's
// existing Rs-denominated wallet, so 1 PKR == 1 demo credit here.
const PRESET_AMOUNTS = [3000, 5000, 10000, 25000, 35000, 50000];
const MIN_AMOUNT = 3000;
const MAX_AMOUNT = 50000;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15; // ~30s

const HOW_IT_WORKS = [
  { step: 1, title: "Choose Amount", desc: "Select or enter the amount you want", icon: IconWallet, bg: "linear-gradient(160deg,#a855f7,#6d28d9)" },
  { step: 2, title: "Pay with Karopay", desc: "Complete the payment using Karopay", icon: null, emoji: "🚀", bg: "linear-gradient(160deg,#4aa8ff,#1565e8)" },
  { step: 3, title: "Auto Credit", desc: "Amount will be added to your wallet instantly", icon: IconUpload, bg: "linear-gradient(160deg,#4aa8ff,#1565e8)" },
  { step: 4, title: "Start Playing", desc: "Use your balance to play and enjoy", icon: IconCheck, bg: "linear-gradient(160deg,#33d19a,#1a9450)" },
];

const formatShort = (v) => (v >= 1000 ? `${v / 1000}K` : `${v}`);

// Karopay's Collection Request is a real server-side call that returns a
// hosted checkout URL — unlike the previous gateway (a browser-submitted
// form POST with no server-side initiate call), we just navigate the
// browser straight to the payUrl it gives back. The user is redirected back
// to this same page afterwards (returnUrl), and on mount we check the URL
// for that return trip and pick up wherever the redirect left off.
export default function KaropayAddFunds({ theme = "dark", triggerClassName, triggerLabel = "Add Funds (Karopay)", onBalanceChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
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
    if (!karopayResult) return;

    // Strip the query params so a page refresh doesn't re-trigger this.
    const url = new URL(window.location.href);
    url.searchParams.delete("karopay");
    url.searchParams.delete("identifier");
    window.history.replaceState({}, "", url.toString());

    if (karopayResult === "return") {
      const identifier = params.get("identifier");
      if (!identifier) return;
      setOpen(true);
      setPhase("polling");
      pollStatus(identifier, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(pollRef.current), []);

  const pollStatus = async (identifier, attempt) => {
    try {
      const res = await fetch(`/api/karopay/status?identifier=${encodeURIComponent(identifier)}`);
      const data = await res.json();
      if (res.ok && data.status === "COMPLETED") {
        setPhase("success");
        setResultBalance(data.balance);
        onBalanceChange?.(data.balance);
        return;
      }
      if (res.ok && ["FAILED", "CANCELLED", "REFUNDED"].includes(data.status)) {
        setPhase("error");
        setResultMessage("Payment did not complete — no funds were added to your virtual wallet.");
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

  const canSubmit = amount && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT && /^3\d{9}$/.test(customerPhone);

  const handlePay = async () => {
    setPhase("redirecting");
    try {
      const res = await fetch("/api/karopay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, customerPhone }),
      });
      const data = await res.json();
      console.log("Karopay create-order responsvvve:",res, data);
      if (!res.ok || !data.payUrl) {
        setPhase("error");
        setResultMessage(data.error || "Could not start Karopay checkout.");
        return;
      }
      window.location.href = data.payUrl;
    } catch {
      setPhase("error");
      setResultMessage("Could not start Karopay checkout. Please try again.");
    }
  };

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

          {phase === "select" && (
            <>
              <div className="kk-popup-title paybost-title">Add Funds via Karopay</div>
              <p className={textClass}>Add funds instantly using Karopay.</p>

              <div className="deposit-amount-head" style={{ marginTop: 14 }}>
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
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step="0.01"
                  placeholder={`Rs${MIN_AMOUNT.toLocaleString()}.00 - Rs${MAX_AMOUNT.toLocaleString()}.00`}
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
                Minimum Rs{MIN_AMOUNT.toLocaleString()} &nbsp;|&nbsp; Maximum Rs{MAX_AMOUNT.toLocaleString()}
              </div>

              <div className="deposit-number-input-box" style={{ marginTop: 12 }}>
                <span>Your Account Number</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="3XXXXXXXXX"
                  maxLength={10}
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

              <button type="button" className="paybost-cancel-btn" onClick={close}>
                Cancel
              </button>
            </>
          )}

          {phase === "redirecting" && <div className={textClass} style={{ marginTop: 16 }}>Redirecting you to Karopay…</div>}

          {phase === "polling" && (
            <div className={textClass} style={{ marginTop: 16 }}>Confirming your payment with Karopay…</div>
          )}

          {phase === "success" && (
            <>
              <div className={textClass} style={{ marginTop: 16, color: "#37f59a", fontWeight: 800 }}>
                Success! Your balance is now Rs{Number(resultBalance).toLocaleString()}.
              </div>
              <button className={btnClass} onClick={close}>
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
        </div>
      </div>
    </>
  );
}
