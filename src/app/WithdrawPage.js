"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function WithdrawPage() {
  const [accountType, setAccountType] = useState("Easypaisa");
  const [amount, setAmount] = useState(500);
  const [manualAmount, setManualAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const selectMethod = (method) => {
    setAccountType(method);
  };

  const selectAmount = (value) => {
    setAmount(value);
    setManualAmount(value.toString());
  };

  const handleManualAmountChange = (e) => {
    const value = e.target.value;
    setManualAmount(value);
    const numValue = Number(value);
    if (numValue > 0) {
      setAmount(numValue);
    } else {
      setAmount(500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic here
    console.log({
      accountType,
      amount,
      accountNumber,
    });
  };

  return (
    <div className="app-shell">
      <div className="app-glow g1"></div>
      <div className="app-glow g2"></div>
      <div className="app-glow g3"></div>

      {/* HEADER */}
      <header className="topbar">
        <div className="top-left">
          <div className="brand-logo">
            <Image
              src="https://pk92.site/images/pics/mainlogo.png"
              alt="Logo"
              width={130}
              height={44}
              className="logo-img"
            />
            <div className="brand-copy">
              <b>PREMIUM</b>
              <span>Withdraw</span>
            </div>
          </div>
        </div>

        <div className="top-right">
          <div className="wallet-pill">
            <div className="wallet-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <span className="wallet-label">Secure</span>
              <div className="wallet-amount">100%</div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="content">
        <section className="hero-card">
          <div className="hero-kicker">
            <i className="fa-solid fa-money-bill-transfer"></i>
            FAST WITHDRAW
          </div>

          <h1>
            Cash Out
            <br />
            <span>Securely</span>
          </h1>

          <p>
            Select your withdraw method, choose an amount button or enter a
            custom amount manually.
          </p>
        </section>

        <div className="quick-row">
          <a href="/history" className="quick-link">
            <i className="fa-solid fa-clock-rotate-left"></i>
            Withdraw History
          </a>
        </div>

        <section className="withdraw-card">
          <div className="card-title">
            <i className="fa-solid fa-wallet"></i>
            Withdraw Request
          </div>

          <form onSubmit={handleSubmit} id="withdrawForm">
            <div className="method-title">Select Payment Method</div>

            <div className="method-grid">
              <button
                type="button"
                onClick={() => selectMethod("Easypaisa")}
                className={`method-btn ${
                  accountType === "Easypaisa" ? "active-method" : ""
                }`}
              >
                <Image
                  src="https://vectorseek.com/wp-content/uploads/2023/12/EASYPAISA-New-Logo-Vector.svg--300x161.png"
                  alt="Easypaisa"
                  width={88}
                  height={38}
                  className="method-logo"
                />
                <p>Easypaisa</p>
              </button>

              <button
                type="button"
                onClick={() => selectMethod("JazzCash")}
                className={`method-btn ${
                  accountType === "JazzCash" ? "active-method" : ""
                }`}
              >
                <Image
                  src="https://vectorseek.com/wp-content/uploads/2020/12/vectorseek.com-Jazz-cash-logo-vector-300x148.png"
                  alt="JazzCash"
                  width={88}
                  height={38}
                  className="method-logo"
                />
                <p>JazzCash</p>
              </button>

              <button
                type="button"
                onClick={() => selectMethod("USDT TRC20")}
                className={`method-btn ${
                  accountType === "USDT TRC20" ? "active-method" : ""
                }`}
              >
                <Image
                  src="https://cryptologos.cc/logos/tether-usdt-logo.png"
                  alt="USDT"
                  width={88}
                  height={38}
                  className="method-logo"
                />
                <p>USDT</p>
              </button>
            </div>

            <input type="hidden" name="account_type" value={accountType} />
            <input type="hidden" name="amount" value={amount} />

            <div className="amount-title">Select Withdraw Amount</div>

            <div className="amount-grid">
              {[500, 1000, 5000, 7000, 10000, 15000, 25000, 50000].map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectAmount(value)}
                    className={`amount-btn ${
                      amount === value && manualAmount === value.toString()
                        ? "active"
                        : ""
                    }`}
                  >
                    <i className="fa-solid fa-coins"></i>
                    {value.toLocaleString()}
                  </button>
                )
              )}
            </div>

            <div className="manual-wrap">
              <input
                type="number"
                id="manualAmount"
                placeholder="Manual withdraw amount"
                className="input"
                min="1"
                value={manualAmount}
                onChange={handleManualAmountChange}
              />

              <div className="amount-note">
                <i className="fa-solid fa-circle-check"></i>
                Button select karne par amount manual field mein show hoga. Aap
                custom amount bhi enter kar sakte hain.
              </div>
            </div>

            <div className="method-title">Account Number / Wallet Address</div>

            <input
              type="text"
              name="account_number"
              placeholder="Account Number / Wallet Address"
              required
              className="input"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />

            <button type="submit" className="submit-btn">
              Submit Withdraw Rs <span id="btnAmount">{amount.toLocaleString()}</span>
            </button>
          </form>
        </section>

        <section className="safe-footer">
          <i className="fa-solid fa-lock"></i>
          100% Secure Transaction
        </section>
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <a href="/home" className="nav-link">
          <i className="fa-solid fa-house-chimney"></i>
          <span>Home</span>
        </a>

        <a href="/deposit" className="nav-link">
          <i className="fa-solid fa-circle-dollar-to-slot"></i>
          <span>Deposit</span>
        </a>

        <a href="/commission" className="center-btn">
          <i className="fa-solid fa-gift"></i>
        </a>

        <a href="/withdraw" className="nav-link active">
          <i className="fa-solid fa-wallet"></i>
          <span>Withdraw</span>
        </a>

        <a href="/profile" className="nav-link">
          <i className="fa-solid fa-user-gear"></i>
          <span>Profile</span>
        </a>
      </nav>

      <style jsx>{`
        :root {
          --void: #07020f;
          --ink: #0f061d;
          --panel: #150a28;
          --panel2: #20113b;
          --line: rgba(255, 255, 255, 0.11);
          --text: #fff8ef;
          --muted: #b9a8ce;
          --gold: #ffd166;
          --pink: #ff3d81;
          --violet: #7c3cff;
          --cyan: #28e7ff;
          --green: #37f59a;
          --danger: #ff5c5c;
          --shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
        }

        .app-shell {
          min-height: 100vh;
          position: relative;
          padding-bottom: 128px;
        }

        .app-shell :global(body) {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
          min-height: 100%;
          font-family: "Space Grotesk", sans-serif;
          color: var(--text);
          background: var(--void);
          overflow-x: hidden;
          padding-bottom: 128px;
        }

        .app-shell :global(body):before {
          content: "";
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at 15% 4%, rgba(255, 61, 129, 0.24), transparent 30%),
            radial-gradient(circle at 90% 8%, rgba(40, 231, 255, 0.2), transparent 26%),
            radial-gradient(circle at 50% 96%, rgba(124, 60, 255, 0.24), transparent 36%),
            linear-gradient(160deg, #07020f 0%, #140727 54%, #05040c 100%);
          z-index: -3;
        }

        .app-shell :global(body):after {
          content: "";
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(255, 255, 255, 0.032) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.032) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.85), transparent);
          z-index: -2;
        }

        .app-glow {
          position: fixed;
          width: 260px;
          height: 260px;
          border-radius: 999px;
          filter: blur(28px);
          opacity: 0.34;
          z-index: -1;
        }

        .g1 {
          top: 90px;
          left: -120px;
          background: var(--pink);
        }
        .g2 {
          right: -140px;
          top: 360px;
          background: var(--cyan);
        }
        .g3 {
          bottom: 20px;
          left: 30%;
          background: var(--violet);
        }

        .topbar {
          position: sticky;
          top: 0;
          height: 86px;
          padding: 14px 15px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 900;
          background: linear-gradient(to bottom, rgba(7, 2, 15, 0.95), rgba(7, 2, 15, 0.62));
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .top-left,
        .top-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-img {
          height: 44px;
          width: auto;
          filter: drop-shadow(0 0 14px rgba(255, 209, 102, 0.32));
        }

        .brand-copy {
          display: none;
        }

        .wallet-pill {
          height: 48px;
          min-width: 132px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 0 10px;
          border: 1px solid rgba(255, 209, 102, 0.25);
          background: linear-gradient(135deg, rgba(255, 209, 102, 0.18), rgba(255, 61, 129, 0.1));
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
        }

        .wallet-icon {
          width: 31px;
          height: 31px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.22);
          display: grid;
          place-items: center;
          color: var(--gold);
        }

        .wallet-label {
          display: block;
          font-size: 9px;
          color: var(--muted);
          line-height: 1;
        }

        .wallet-amount {
          font-family: "Rajdhani", sans-serif;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.05;
        }

        .content {
          width: 92%;
          max-width: 560px;
          margin: 0 auto;
          padding: 18px 0 0;
        }

        .hero-card {
          border-radius: 34px;
          padding: 22px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255, 209, 102, 0.18), rgba(255, 61, 129, 0.12), rgba(124, 60, 255, 0.14));
          border: 1px solid rgba(255, 255, 255, 0.11);
          box-shadow: var(--shadow);
          margin-bottom: 16px;
        }

        .hero-card:before {
          content: "";
          position: absolute;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          right: -70px;
          top: -75px;
          background: rgba(255, 255, 255, 0.1);
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.11);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--gold);
          font-size: 11px;
          font-weight: 900;
          position: relative;
          z-index: 2;
        }

        .hero-card h1 {
          margin-top: 14px;
          font-family: "Rajdhani", sans-serif;
          font-size: 42px;
          line-height: 0.9;
          text-transform: uppercase;
          position: relative;
          z-index: 2;
        }

        .hero-card h1 span {
          color: var(--gold);
        }

        .hero-card p {
          margin-top: 12px;
          color: #eadff7;
          font-size: 13px;
          line-height: 1.55;
          position: relative;
          z-index: 2;
        }

        .quick-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .quick-link {
          min-height: 62px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.035));
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.22);
          text-decoration: none;
          color: inherit;
        }

        .quick-link i {
          color: var(--gold);
        }

        .withdraw-card,
        .safe-footer {
          border-radius: 32px;
          padding: 20px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.035));
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: var(--shadow);
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }

        .withdraw-card:before {
          content: "";
          position: absolute;
          width: 230px;
          height: 230px;
          border-radius: 50%;
          background: rgba(40, 231, 255, 0.08);
          left: -120px;
          top: -120px;
          filter: blur(8px);
        }

        .card-title {
          position: relative;
          z-index: 2;
          font-family: "Rajdhani", sans-serif;
          font-size: 27px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .card-title i {
          color: var(--gold);
        }

        .method-title,
        .amount-title {
          font-size: 13px;
          font-weight: 900;
          color: #f4eaff;
          margin: 16px 0 10px;
          position: relative;
          z-index: 2;
        }

        .method-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .method-btn {
          border: none;
          min-height: 92px;
          border-radius: 22px;
          padding: 12px 8px;
          background: #fff;
          cursor: pointer;
          transition: 0.25s;
          color: #111;
          font-weight: 900;
          border: 2px solid transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .method-btn img,
        .method-btn :global(img) {
          width: 100%;
          max-width: 88px;
          height: 38px;
          object-fit: contain;
          margin: auto;
          display: block;
        }

        .method-btn p {
          margin-top: 8px;
          font-size: 11px;
        }

        .active-method {
          border-color: var(--gold);
          transform: translateY(-2px);
          box-shadow: 0 0 24px rgba(255, 209, 102, 0.32);
        }

        .amount-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .amount-btn {
          min-height: 62px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 21px;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(145deg, rgba(124, 60, 255, 0.2), rgba(255, 61, 129, 0.08));
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-size: 15px;
          font-weight: 900;
          transition: 0.25s;
        }

        .amount-btn i {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #180511;
          background: linear-gradient(135deg, var(--gold), #ff9f43);
          box-shadow: 0 0 16px rgba(255, 209, 102, 0.26);
        }

        .amount-btn.active {
          background: linear-gradient(135deg, var(--gold), #ff8b3d, var(--pink));
          color: #180511;
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(255, 61, 129, 0.26);
        }

        .amount-btn.active i {
          background: #180511;
          color: var(--gold);
        }

        .manual-wrap {
          margin-top: 12px;
          position: relative;
          z-index: 2;
        }

        .input {
          width: 100%;
          height: 58px;
          border: none;
          outline: none;
          padding: 0 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 15px;
          margin-bottom: 12px;
        }

        .input::placeholder {
          color: #a999bf;
        }

        .amount-note {
          margin-top: 8px;
          padding: 12px 14px;
          border-radius: 18px;
          background: rgba(255, 209, 102, 0.08);
          border: 1px solid rgba(255, 209, 102, 0.14);
          color: #f3dfac;
          font-size: 12px;
          line-height: 1.45;
        }

        .submit-btn {
          width: 100%;
          height: 58px;
          border: none;
          border-radius: 20px;
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          color: #fff;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.25s;
          position: relative;
          z-index: 2;
          box-shadow: 0 16px 36px rgba(40, 231, 255, 0.22);
        }

        .submit-btn:active,
        .amount-btn:active,
        .method-btn:active,
        .quick-link:active {
          transform: scale(0.96);
        }

        .safe-footer {
          padding: 17px;
          text-align: center;
          color: #d8cdea;
          font-size: 13px;
          font-weight: 800;
          margin-top: 18px;
        }

        .safe-footer i {
          width: 38px;
          height: 38px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          margin: 0 auto 9px;
          background: linear-gradient(135deg, var(--green), var(--cyan));
          color: #06120e;
          font-size: 17px;
        }

        .bottom-nav {
          position: fixed;
          left: 50%;
          bottom: 13px;
          transform: translateX(-50%);
          width: 94%;
          max-width: 460px;
          height: 78px;
          border-radius: 30px;
          background: rgba(12, 5, 25, 0.88);
          backdrop-filter: blur(22px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.52);
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 950;
        }

        .nav-link {
          min-width: 58px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: #9d8db4;
          font-size: 10px;
          font-weight: 800;
          text-decoration: none;
        }

        .nav-link i {
          font-size: 18px;
        }

        .nav-link.active {
          color: var(--gold);
        }

        .center-btn {
          width: 66px;
          height: 66px;
          margin-top: -36px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, var(--gold), var(--pink));
          color: #1a0614;
          font-size: 25px;
          border: 5px solid #080311;
          box-shadow: 0 18px 40px rgba(255, 61, 129, 0.36);
          transform: rotate(45deg);
          text-decoration: none;
        }

        .center-btn i {
          transform: rotate(-45deg);
        }

        @media (min-width: 680px) {
          .brand-copy {
            display: block;
          }
          .brand-copy b {
            display: block;
            font-family: "Rajdhani", sans-serif;
            font-size: 22px;
            line-height: 0.95;
          }
          .brand-copy span {
            font-size: 10px;
            color: var(--muted);
          }
          .amount-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 430px) {
          .topbar {
            height: 80px;
            padding-inline: 12px;
          }
          .wallet-pill {
            min-width: 118px;
            padding: 0 9px;
          }
          .wallet-label {
            display: none;
          }
          .wallet-amount {
            font-size: 13px;
          }
          .content {
            width: 94%;
            padding-top: 14px;
          }
          .hero-card h1 {
            font-size: 37px;
          }
          .withdraw-card {
            padding: 17px;
            border-radius: 28px;
          }
          .method-grid {
            gap: 8px;
          }
          .method-btn {
            min-height: 84px;
            border-radius: 18px;
          }
          .amount-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .amount-btn {
            min-height: 58px;
            font-size: 14px;
          }
          .bottom-nav {
            height: 74px;
            bottom: 10px;
            border-radius: 27px;
          }
        }
      `}</style>
    </div>
  );
}