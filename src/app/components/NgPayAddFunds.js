"use client";

import { useEffect, useRef, useState } from "react";
import { IconX, IconChevronRight, IconWallet } from "../icons";

// NG Pay deposits are PKR, 1 PKR == 1 demo credit — must match
// NGPAY_MIN/MAX_DEPOSIT_AMOUNT in src/lib/payments.js.
const PRESET_AMOUNTS = [500, 1000, 3000, 5000, 10000, 25000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 50000;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 45;
const HOME_REDIRECT_DELAY_MS = 2500;
// Remembers the order the browser left for, so coming back without NG Pay's
// redirect (Back button, reopening the app) still resumes the status check.
const PENDING_KEY = "ngpay_pending_order";
const PENDING_MAX_AGE_MS = 30 * 60_000;

const CHANNELS = [
  { key: "easypaisa", label: "Easypaisa", logo: "/game/esy.png" },
  { key: "jazzcash", label: "JazzCash", logo: "/game/jazz.png" },
];

const formatShort = (v) => (v >= 1000 ? `${v / 1000}K` : `${v}`);

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

// NG Pay checkout: our server creates the order and gets back NG Pay's hosted
// cashier URL; the browser goes there, then returns to /deposit?ngpay=return
// and polls /api/ngpay/status until the credit lands.
export default function NgPayAddFunds({ onBalanceChange }) {
  const [amount, setAmount] = useState(null);
  const [channel, setChannel] = useState("easypaisa");
  const [phase, setPhase] = useState("select"); // select | redirecting | polling | success | error
  const [resultMessage, setResultMessage] = useState("");
  const [resultBalance, setResultBalance] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resume = (identifier) => {
      clearTimeout(pollRef.current);
      setPhase("polling");
      pollStatus(identifier, 0);
    };

    if (params.has("ngpay")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("ngpay");
      url.searchParams.delete("identifier");
      window.history.replaceState({}, "", url.toString());
      const identifier = params.get("identifier");
      if (params.get("ngpay") === "return" && identifier) resume(identifier);
    } else {
      const pending = readPendingOrder();
      if (pending) resume(pending);
    }

    const onPageShow = (e) => {
      if (!e.persisted) return;
      const pending = readPendingOrder();
      if (pending) resume(pending);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollStatus = async (identifier, attempt) => {
    try {
      const res = await fetch(`/api/ngpay/status?identifier=${encodeURIComponent(identifier)}`);
      const data = await res.json();
      if (res.ok && data.status === "COMPLETED") {
        clearPendingOrder();
        setPhase("success");
        setResultBalance(data.balance);
        onBalanceChange?.(data.balance);
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
      setResultMessage("Still waiting on confirmation from NG Pay. If your balance doesn't update in a minute, this payment likely wasn't completed.");
      return;
    }
    pollRef.current = setTimeout(() => pollStatus(identifier, attempt + 1), POLL_INTERVAL_MS);
  };

  const reset = () => {
    clearTimeout(pollRef.current);
    setPhase("select");
    setResultMessage("");
    setResultBalance(null);
  };

  const canSubmit = amount && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;

  const handlePay = async () => {
    setPhase("redirecting");
    try {
      const res = await fetch("/api/ngpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, channel }),
      });
      const data = await res.json();
      if (!res.ok || !data.payUrl) {
        setPhase("error");
        setResultMessage(data.error || "Could not start NG Pay checkout.");
        return;
      }
      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify({ identifier: data.identifier, at: Date.now() }));
      } catch {}
      window.location.href = data.payUrl;
    } catch {
      setPhase("error");
      setResultMessage("Could not start NG Pay checkout. Please try again.");
    }
  };

  return (
    <div className="karopay-inline">
      {phase === "select" && (
        <>
          <div className="deposit-amount-head">
            <span className="deposit-amount-icon">
              <IconWallet />
            </span>
            <h2>Add funds amount</h2>
          </div>

          <div className="deposit-amount-grid">
            {PRESET_AMOUNTS.map((v) => (
              <button type="button" key={v} className={`deposit-amount-tile ${amount === v ? "active" : ""}`} onClick={() => setAmount(v)}>
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
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step="0.01"
              placeholder={`Rs${MIN_AMOUNT.toLocaleString()}.00 - Rs${MAX_AMOUNT.toLocaleString()}.00`}
              style={{ fontWeight: 500 }}
              value={amount ?? ""}
              onChange={(e) => setAmount(e.target.value === "" ? null : Number(e.target.value) || 0)}
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

          <button type="button" className="deposit-submit-btn" style={{ marginTop: 16, width: "95%" }} disabled={!canSubmit} onClick={handlePay}>
            Pay Rs{amount || 0} with NG Pay
            <IconChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </>
      )}

      {phase === "redirecting" && <div className="kk-popup-text" style={{ marginTop: 16 }}>Redirecting you to NG Pay…</div>}

      {phase === "polling" && <div className="kk-popup-text" style={{ marginTop: 16 }}>Confirming your payment with NG Pay…</div>}

      {phase === "success" && (
        <>
          <div className="kk-popup-text" style={{ marginTop: 16, color: "#37f59a", fontWeight: 800 }}>
            Success! Your balance is now Rs{Number(resultBalance).toLocaleString()}. Taking you home…
          </div>
          <button className="kk-popup-btn" onClick={() => window.location.assign("/")}>
            Done
          </button>
        </>
      )}

      {phase === "error" && (
        <>
          <div className="kk-popup-text" style={{ marginTop: 16, color: "#ff5c5c" }}>
            {resultMessage || "Payment Failed — no funds were added to your wallet."}
          </div>
          <button className="kk-popup-btn" onClick={reset}>
            Try again
          </button>
        </>
      )}
    </div>
  );
}
