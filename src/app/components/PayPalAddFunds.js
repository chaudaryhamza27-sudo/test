"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { IconShield, IconX, IconWallet, IconUpload, IconCheck } from "../icons";

const PRESET_AMOUNTS = [5, 10, 20, 50, 100, 200];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 500;
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

const HOW_IT_WORKS = [
  { step: 1, title: "Choose Amount", desc: "Select or enter the amount you want", icon: IconWallet, bg: "linear-gradient(160deg,#a855f7,#6d28d9)" },
  { step: 2, title: "Pay with PayPal", desc: "Complete the sandbox payment", icon: null, emoji: "🅿️", bg: "linear-gradient(160deg,#4aa8ff,#1565e8)" },
  { step: 3, title: "Auto Credit", desc: "Amount will be added to your wallet instantly", icon: IconUpload, bg: "linear-gradient(160deg,#4aa8ff,#1565e8)" },
  { step: 4, title: "Start Playing", desc: "Use your balance to play and enjoy", icon: IconCheck, bg: "linear-gradient(160deg,#33d19a,#1a9450)" },
];

// `theme` picks which of the app's two existing popup styles to reuse:
// "light" -> .kk-popup-box (Home/Wallet/Profile pages), "dark" -> .popup-box (Deposit/Withdraw/Game pages).
export default function PayPalAddFunds({ theme = "dark", triggerClassName, triggerLabel = "Add Funds (PayPal Sandbox)", onBalanceChange }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(20);
  const [manualAmount, setManualAmount] = useState("");
  const [phase, setPhase] = useState("select"); // select | processing | success | cancelled | error
  const [resultMessage, setResultMessage] = useState("");
  const [resultBalance, setResultBalance] = useState(null);

  const boxClass = theme === "light" ? "kk-popup-box" : "popup-box";
  const textClass = theme === "light" ? "kk-popup-text" : "popup-text";
  const btnClass = theme === "light" ? "kk-popup-btn" : "popup-btn";

  const reset = () => {
    setPhase("select");
    setResultMessage("");
    setResultBalance(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const pickAmount = (v) => {
    setAmount(v);
    setManualAmount("");
  };

  const handleManualChange = (e) => {
    const v = e.target.value;
    setManualAmount(v);
    const n = Number(v);
    setAmount(Number.isFinite(n) ? n : 0);
  };

  const createOrder = async () => {
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not start checkout.");
    return data.orderId;
  };

  const onApprove = async (data) => {
    setPhase("processing");
    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPhase("error");
        setResultMessage(json.error || "Payment could not be completed.");
        return;
      }
      setPhase("success");
      setResultBalance(json.balance);
      onBalanceChange?.(json.balance);
    } catch {
      setPhase("error");
      setResultMessage("Payment Failed — no funds were added to your virtual wallet.");
    }
  };

  const onCancel = () => {
    setPhase("cancelled");
  };

  const onError = (err) => {
    if (process.env.NODE_ENV === "development") console.error("[PayPal]", err);
    setPhase("error");
    setResultMessage("Payment Failed — no funds were added to your virtual wallet.");
  };

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      <div className={`popup ${open ? "active" : ""}`} onClick={close}>
        <div className={`${boxClass} paybost-modal`} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="paybost-close-btn" onClick={close} aria-label="Close">
            <IconX />
          </button>

          <div className="paybost-modal-badge">
            <span>🅿️</span> PAYPAL <span className="dot">•</span> SANDBOX <span className="dot">•</span> NO REAL MONEY
          </div>

          {phase === "select" && (
            <>
              <div className="kk-popup-title" style={{ fontSize: 22, marginTop: 12 }}>
                Add Funds via PayPal
              </div>
              <p className={textClass}>Add virtual funds instantly using PayPal Sandbox.</p>

              <div className="paybost-range-box">
                <div className="paybost-range-icon">
                  <IconWallet />
                </div>
                <div>
                  <div className="paybost-range-label">Virtual balance will be added</div>
                  <div className="paybost-range-value">
                    ${MIN_AMOUNT} ~ ${MAX_AMOUNT}
                  </div>
                  <div className="paybost-range-sub">Choose an amount or enter custom value</div>
                </div>
              </div>

              <div className="paybost-section-label">Quick Select Amount</div>
              <div className="paybost-quick-grid">
                {PRESET_AMOUNTS.map((v) => (
                  <button
                    type="button"
                    key={v}
                    className={`paybost-amount-pill ${!manualAmount && amount === v ? "active" : ""}`}
                    onClick={() => pickAmount(v)}
                  >
                    ${v}
                  </button>
                ))}
                <button
                  type="button"
                  className={`paybost-amount-pill ${manualAmount !== "" ? "active" : ""}`}
                  onClick={() => document.getElementById("paypal-custom-input")?.focus()}
                >
                  Custom
                </button>
              </div>

              <div className="paybost-section-label" style={{ marginTop: 16 }}>Custom Amount</div>
              <div className="paybost-custom-row">
                <span className="paybost-rs-prefix">$</span>
                <input
                  id="paypal-custom-input"
                  type="number"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step="0.01"
                  placeholder="Enter amount"
                  className="paybost-custom-input2"
                  value={manualAmount}
                  onChange={handleManualChange}
                />
              </div>
              <div className="paybost-min-max">
                Minimum ${MIN_AMOUNT} &nbsp;|&nbsp; Maximum ${MAX_AMOUNT}
              </div>

              <div className="paybost-how-card">
                <div className="paybost-how-head">
                  <IconShield style={{ width: 15, height: 15, color: "var(--link)" }} />
                  How PayPal Sandbox Works
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

              <div className="alert alert-info" style={{ marginTop: 14 }}>
                <IconShield style={{ width: 15, height: 15, flexShrink: 0 }} />
                <span>
                  <b>This is a test mode using PayPal Sandbox.</b> No real money is involved. Funds are for practice
                  purposes only.
                </span>
              </div>

              {CLIENT_ID ? (
                <div style={{ marginTop: 16 }}>
                  <PayPalScriptProvider options={{ clientId: CLIENT_ID, currency: "USD", intent: "capture" }}>
                    <PayPalButtons
                      style={{ layout: "vertical" }}
                      disabled={!amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT}
                      forceReRender={[amount]}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onCancel={onCancel}
                      onError={onError}
                    />
                  </PayPalScriptProvider>
                </div>
              ) : (
                <div className={textClass} style={{ marginTop: 16 }}>
                  PayPal Sandbox isn&apos;t configured yet (missing NEXT_PUBLIC_PAYPAL_CLIENT_ID).
                </div>
              )}
              <button type="button" className="paybost-cancel-btn" onClick={close}>
                Cancel
              </button>
            </>
          )}

          {phase === "processing" && <div className={textClass} style={{ marginTop: 16 }}>Confirming your payment with PayPal…</div>}

          {phase === "success" && (
            <>
              <div className={textClass} style={{ marginTop: 16, color: "#37f59a", fontWeight: 800 }}>
                Success! Your virtual balance is now Rs{Number(resultBalance).toLocaleString()}.
              </div>
              <button className={btnClass} onClick={close}>
                Done
              </button>
            </>
          )}

          {phase === "cancelled" && (
            <>
              <div className={textClass} style={{ marginTop: 16 }}>
                Payment Cancelled — your virtual balance was not changed.
              </div>
              <button className={btnClass} onClick={reset}>
                Try again
              </button>
            </>
          )}

          {phase === "error" && (
            <>
              <div className={textClass} style={{ marginTop: 16, color: "#ff5c5c" }}>
                {resultMessage || "Payment Failed — no funds were added to your virtual wallet."}
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
