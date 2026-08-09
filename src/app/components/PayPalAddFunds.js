"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PRESET_AMOUNTS = [5, 10, 20, 50, 100];
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// `theme` picks which of the app's two existing popup styles to reuse:
// "light" -> .kk-popup-box (Home/Wallet/Profile pages), "dark" -> .popup-box (Deposit/Withdraw/Game pages).
export default function PayPalAddFunds({ theme = "dark", triggerClassName, triggerLabel = "Add Funds (PayPal Sandbox)", onBalanceChange }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(20);
  const [manualAmount, setManualAmount] = useState("20");
  const [phase, setPhase] = useState("select"); // select | processing | success | cancelled | error
  const [resultMessage, setResultMessage] = useState("");
  const [resultBalance, setResultBalance] = useState(null);

  const boxClass = theme === "light" ? "kk-popup-box" : "popup-box";
  const titleClass = theme === "light" ? "kk-popup-title" : "popup-title";
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
    setManualAmount(String(v));
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
      setResultMessage("Payment Failed — no funds were added to your demo wallet.");
    }
  };

  const onCancel = () => {
    setPhase("cancelled");
  };

  const onError = (err) => {
    if (process.env.NODE_ENV === "development") console.error("[PayPal]", err);
    setPhase("error");
    setResultMessage("Payment Failed — no funds were added to your demo wallet.");
  };

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      <div className={`popup ${open ? "active" : ""}`} onClick={close}>
        <div className={boxClass} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <div className="paypal-sandbox-badge">PAYPAL SANDBOX — DEMO / TEST</div>
          <div className={titleClass} style={{ fontSize: 22, marginTop: 10 }}>
            Add Demo Funds
          </div>
          <p className={textClass}>No real money is being processed. This credits simulated demo balance only.</p>

          {phase === "select" && (
            <>
              <div className="amount-grid" style={{ marginTop: 16 }}>
                {PRESET_AMOUNTS.map((v) => (
                  <label className="amount-option" key={v}>
                    <input type="radio" name="paypal_amount" checked={amount === v} onChange={() => pickAmount(v)} />
                    <div className="amount-box">
                      <div className="coin-icon">$</div>
                      <div>
                        <b>${v}</b>
                        <span>USD (sandbox)</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="manual-box" style={{ marginTop: 12 }}>
                <div className="manual-label">
                  Custom Amount
                  <span>$1 – $500</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.01"
                  className="manual-input"
                  value={manualAmount}
                  onChange={handleManualChange}
                />
              </div>

              {CLIENT_ID ? (
                <div style={{ marginTop: 16 }}>
                  <PayPalScriptProvider options={{ clientId: CLIENT_ID, currency: "USD", intent: "capture" }}>
                    <PayPalButtons
                      style={{ layout: "vertical" }}
                      disabled={!amount || amount < 1 || amount > 500}
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
            </>
          )}

          {phase === "processing" && <div className={textClass} style={{ marginTop: 16 }}>Confirming your payment with PayPal…</div>}

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
