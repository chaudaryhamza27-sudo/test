"use client";

import { useEffect, useRef, useState } from "react";

// This merchant's Paybost sandbox account only accepts PKR — matches this
// app's existing Rs-denominated wallet, so 1 PKR (test) == 1 demo credit here.
const PRESET_AMOUNTS = [1000, 3000, 5000, 10000, 25000, 50000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 100000;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15; // ~30s

// Paybost is a redirect-based hosted checkout (no embedded JS SDK), so this
// component works differently from PayPalAddFunds: clicking "Pay" navigates
// the whole page to Paybost, and the user is redirected back to this same
// page afterwards. On mount we check the URL for that return trip and pick
// up wherever the popup left off.
export default function PaybostAddFunds({ theme = "dark", triggerClassName, triggerLabel = "Add Funds (Paybost — Test Mode)", onBalanceChange }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(3000);
  const [manualAmount, setManualAmount] = useState("3000");
  const [phase, setPhase] = useState("select"); // select | redirecting | polling | success | cancelled | error
  const [resultMessage, setResultMessage] = useState("");
  const [resultBalance, setResultBalance] = useState(null);
  const pollRef = useRef(null);

  const boxClass = theme === "light" ? "kk-popup-box" : "popup-box";
  const titleClass = theme === "light" ? "kk-popup-title" : "popup-title";
  const textClass = theme === "light" ? "kk-popup-text" : "popup-text";
  const btnClass = theme === "light" ? "kk-popup-btn" : "popup-btn";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paybostResult = params.get("paybost");
    if (!paybostResult) return;

    // Strip the query params so a page refresh doesn't re-trigger this.
    const url = new URL(window.location.href);
    url.searchParams.delete("paybost");
    url.searchParams.delete("identifier");
    window.history.replaceState({}, "", url.toString());

    if (paybostResult === "cancelled") {
      setOpen(true);
      setPhase("cancelled");
      return;
    }

    if (paybostResult === "success") {
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
      const res = await fetch(`/api/paybost/status?identifier=${encodeURIComponent(identifier)}`);
      const data = await res.json();
      if (res.ok && data.status === "COMPLETED") {
        setPhase("success");
        setResultBalance(data.balance);
        onBalanceChange?.(data.balance);
        return;
      }
      if (res.ok && ["FAILED", "CANCELLED", "REFUNDED"].includes(data.status)) {
        setPhase("error");
        setResultMessage("Payment did not complete — no funds were added to your demo wallet.");
        return;
      }
    } catch {
      // keep polling — a transient network error shouldn't give up early
    }

    if (attempt + 1 >= POLL_MAX_ATTEMPTS) {
      setPhase("error");
      setResultMessage(
        "Still waiting on confirmation from Paybost. If your balance doesn't update in a minute, this test payment likely wasn't completed."
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

  const pickAmount = (v) => {
    setAmount(v);
    setManualAmount(String(v));
  };

  const handleManualChange = (e) => {
    const v = e.target.value;
    setManualAmount(v);
    const n = Number(v);
    setAmount(Number.isFinite(n) ? n : 0);
  };

  const handlePay = async () => {
    setPhase("redirecting");
    try {
      const res = await fetch("/api/paybost/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setPhase("error");
        setResultMessage(data.error || "Could not start Paybost checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setPhase("error");
      setResultMessage("Could not start Paybost checkout. Please try again.");
    }
  };

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      <div className={`popup ${open ? "active" : ""}`} onClick={phase === "polling" ? undefined : close}>
        <div className={boxClass} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <div className="demo-payment-badge">PAYBOST — TEST MODE / NO REAL MONEY</div>
          <div className={titleClass} style={{ fontSize: 22, marginTop: 10 }}>
            Add Demo Funds
          </div>
          <p className={textClass}>
            Paybost is running in test mode. No real JazzCash/EasyPaisa payment is processed — this only credits
            simulated demo balance.
          </p>

          {phase === "select" && (
            <>
              <div className="amount-grid" style={{ marginTop: 16 }}>
                {PRESET_AMOUNTS.map((v) => (
                  <label className="amount-option" key={v}>
                    <input type="radio" name="paybost_amount" checked={amount === v} onChange={() => pickAmount(v)} />
                    <div className="amount-box">
                      <div className="coin-icon">🪙</div>
                      <div>
                        <b>Rs{v.toLocaleString()}</b>
                        <span>PKR (test mode)</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="manual-box" style={{ marginTop: 12 }}>
                <div className="manual-label">
                  Custom Amount
                  <span>Rs{MIN_AMOUNT} – Rs{MAX_AMOUNT.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step="0.01"
                  className="manual-input"
                  value={manualAmount}
                  onChange={handleManualChange}
                />
              </div>

              <button
                type="button"
                className={btnClass}
                style={{ marginTop: 16 }}
                disabled={!amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT}
                onClick={handlePay}
              >
                Pay Rs{amount || 0} with Paybost
              </button>
            </>
          )}

          {phase === "redirecting" && <div className={textClass} style={{ marginTop: 16 }}>Redirecting you to Paybost…</div>}

          {phase === "polling" && (
            <div className={textClass} style={{ marginTop: 16 }}>Confirming your payment with Paybost…</div>
          )}

          {phase === "success" && (
            <>
              <div className={textClass} style={{ marginTop: 16, color: "#37f59a", fontWeight: 800 }}>
                Success! Your demo balance is now Rs{Number(resultBalance).toLocaleString()}.
              </div>
              <button className={btnClass} onClick={close}>
                Done
              </button>
            </>
          )}

          {phase === "cancelled" && (
            <>
              <div className={textClass} style={{ marginTop: 16 }}>
                Payment Cancelled — your demo balance was not changed.
              </div>
              <button className={btnClass} onClick={reset}>
                Try again
              </button>
            </>
          )}

          {phase === "error" && (
            <>
              <div className={textClass} style={{ marginTop: 16, color: "#ff5c5c" }}>
                {resultMessage || "Payment Failed — no funds were added to your demo wallet."}
              </div>
              <button className={btnClass} onClick={reset}>
                Try again
              </button>
            </>
          )}

          {phase === "select" && (
            <button className={btnClass} style={{ marginTop: 14, background: "transparent", boxShadow: "none" }} onClick={close}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </>
  );
}
