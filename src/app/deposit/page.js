"use client";

import { useEffect, useRef, useState } from "react";
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

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];
const MIN_DEPOSIT = 100;
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export default function DepositPage() {
  const router = useRouter();
  const [tab, setTab] = useState("manual");
  const [balance, setBalance] = useState(0);
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState(500);
  const [customMode, setCustomMode] = useState(false);
  const [proof, setProof] = useState(null); // { name, type, dataUri }
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBalance(data.balance))
      .catch(() => router.push("/login"));
    fetch("/api/deposit/account")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setAccount)
      .catch(() => setAccount(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNotice = (msg, tone = "info") => setPopup({ msg, tone });
  const closeNotice = () => setPopup(null);

  const pickAmount = (v) => {
    setAmount(v);
    setCustomMode(false);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      openNotice("Please upload a JPG, PNG or PDF file.", "error");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      openNotice("File is too large — maximum size is 5MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProof({ name: file.name, type: file.type, dataUri: reader.result });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!amount || amount < MIN_DEPOSIT) {
      openNotice(`Minimum deposit is Rs${MIN_DEPOSIT}.`, "error");
      return;
    }
    if (!proof) {
      openNotice("Please upload your payment proof before submitting.", "error");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: "Manual Bank Transfer", proofImage: proof.dataUri }),
      });
      const data = await res.json();
      if (!res.ok) {
        openNotice(data.error || "Failed to submit deposit request.", "error");
        return;
      }
      setProof(null);
      openNotice(
        `Deposit Request Submitted — Your payment proof has been received and is waiting for admin verification. You'll be notified once it's reviewed.`,
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
          <button className={`deposit-tab ${tab === "manual" ? "active" : ""}`} onClick={() => setTab("manual")}>
            <span className="deposit-tab-icon blue">
              <IconDeposit />
            </span>
            <span>
              <b>Manual Deposit</b>
              <span>Deposit manually</span>
            </span>
          </button>
          <button className={`deposit-tab ${tab === "paybost" ? "active" : ""}`} onClick={() => setTab("paybost")}>
            <span className="deposit-tab-icon purple">🚀</span>
            <span>
              <b>Add Funds (Paybost)</b>
              <span>Instant deposit via Paybost</span>
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
                    <h2>Upload Payment Proof</h2>
                    <p>Upload screenshot or receipt of your payment</p>
                  </div>
                </div>
                <div
                  className={`deposit-dropzone ${dragOver ? "drag" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  {proof ? (
                    <>
                      {proof.type.startsWith("image/") ? (
                        <img src={proof.dataUri} alt="Payment proof preview" className="deposit-proof-preview" />
                      ) : (
                        <div className="deposit-proof-file">📄 {proof.name}</div>
                      )}
                      <span className="deposit-proof-name">{proof.name} — tap to replace</span>
                    </>
                  ) : (
                    <>
                      <IconDeposit style={{ width: 26, height: 26, color: "var(--kk-blue)" }} />
                      <span>
                        Click to <b>upload</b> or drag and drop
                      </span>
                      <span className="deposit-dropzone-hint">JPG, PNG or PDF (Max. 5MB)</span>
                    </>
                  )}
                </div>
              </section>

              <section className="deposit-step-card">
                <div className="deposit-step-head">
                  <span className="deposit-step-num">3</span>
                  <div>
                    <h2>Important Instructions</h2>
                  </div>
                </div>
                <ul className="deposit-instructions">
                  <li>Send the exact amount to the account below</li>
                  <li>Upload clear payment proof</li>
                  <li>Your deposit will be verified within minutes</li>
                </ul>
              </section>

              <button className="deposit-submit-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Deposit Request"}
                <IconChevronRight style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div className="deposit-side-col">
              <section className="deposit-info-card">
                <div className="deposit-info-head">
                  <span className="deposit-info-icon">🏦</span>
                  <div>
                    <h2>Deposit Information</h2>
                    <p>Send your payment to the account below</p>
                  </div>
                </div>
                <dl className="deposit-info-list">
                  <div>
                    <dt>Account Title</dt>
                    <dd>{account?.accountTitle || "…"}</dd>
                  </div>
                  <div>
                    <dt>Bank Name</dt>
                    <dd>{account?.bankName || "…"}</dd>
                  </div>
                  <div>
                    <dt>Account Number</dt>
                    <dd>{account?.accountNumber || "…"}</dd>
                  </div>
                  <div>
                    <dt>IBAN</dt>
                    <dd>{account?.iban || "…"}</dd>
                  </div>
                  <div>
                    <dt>Branch</dt>
                    <dd>{account?.branch || "…"}</dd>
                  </div>
                  <div>
                    <dt>Account Type</dt>
                    <dd>{account?.accountType || "…"}</dd>
                  </div>
                </dl>
              </section>

              <div className="alert alert-info">
                <IconShield style={{ width: 16, height: 16, flexShrink: 0 }} />
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
                <p style={{ fontSize: 12.5, color: "var(--kk-muted)", marginBottom: 18 }}>
                  Credit demo funds instantly through Paybost&apos;s sandbox checkout — running in test mode, still
                  100% simulated, still no real money.
                </p>
                <PaybostAddFunds theme="light" triggerClassName="deposit-submit-btn" triggerLabel="🚀 Add Funds Instantly via Paybost" onBalanceChange={setBalance} />
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
          <Link href="/legal/contact" className="btn btn-secondary" style={{ textDecoration: "none" }}>
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
