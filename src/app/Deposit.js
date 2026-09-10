'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Deposit() {
  const [amount, setAmount] = useState(2000);
  const [manualValue, setManualValue] = useState('2000');
  const [selectedMethod, setSelectedMethod] = useState('Jazzcash_Direct');
  const [mobileNumber, setMobileNumber] = useState('');
  const formRef = useRef(null);

  const setAmountValue = (value, updateManual = true) => {
    let parsedValue = parseInt(value || 2000, 10);
    if (isNaN(parsedValue) || parsedValue < 2000) {
      parsedValue = 2000;
    }
    setAmount(parsedValue);
    if (updateManual) {
      setManualValue(parsedValue.toString());
    }
  };

  const syncCheckedAmount = (value) => {
    const parsedValue = parseInt(value || 2000, 10);
    let matched = false;
    document.querySelectorAll('input[name="amount_option"]').forEach((option) => {
      if (parseInt(option.value, 10) === parsedValue) {
        option.checked = true;
        matched = true;
      } else {
        option.checked = false;
      }
    });
    return matched;
  };

  useEffect(() => {
    // Set initial amount on mount
    const initialAmount = 2000;
    setAmount(initialAmount);
    setManualValue(initialAmount.toString());
    // Sync radio buttons after render
    setTimeout(() => {
      syncCheckedAmount(initialAmount);
    }, 0);
  }, []);

  const handleAmountOptionChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setAmountValue(val, true);
  };

  const handleManualChange = (e) => {
    const val = e.target.value;
    setManualValue(val);

    if (val === '') {
      setAmountValue(2000, false);
      syncCheckedAmount(2000);
      return;
    }

    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setAmount(parsed);
      syncCheckedAmount(parsed);
    }
  };

  const handleMethodChange = (e) => {
    setSelectedMethod(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let value = parseInt(manualValue || amount || 0, 10);

    if (isNaN(value) || value < 2000) {
      alert('Minimum deposit Rs 2,000 hai.');
      setAmountValue(2000, true);
      syncCheckedAmount(2000);
      const manualInput = document.getElementById('manualAmount');
      if (manualInput) manualInput.focus();
      return false;
    }

    setAmountValue(value, true);
    // Form submission would continue here
    alert(`Deposit of Rs ${value.toLocaleString()} via ${selectedMethod} initiated.`);
  };

  const amountOptions = [2000, 5000, 7500, 10000, 25000, 50000];

  return (
    <>
      <div className="app-shell">
        <div className="app-glow g1"></div>
        <div className="app-glow g2"></div>
        <div className="app-glow g3"></div>

        <header className="topbar">
          <div className="top-left">
            <div className="brand-logo">
              <img src="https://pk92.site/images/pics/mainlogo.png" alt="Logo" />
              <div className="brand-copy">
                <b>PREMIUM</b>
                <span>Gaming Club</span>
              </div>
            </div>
          </div>

          <div className="top-right">
            <div className="header-badge">
              <i className="fa-solid fa-shield-halved"></i>
              Secure
            </div>
          </div>
        </header>

        <main className="content">
          <section className="deposit-hero">
            <div className="deposit-kicker">
              <i className="fa-solid fa-crown"></i>
              PREMIUM DEPOSIT
            </div>

            <h1 className="deposit-title">
              Fast &amp;<br />
              <span>Secure Pay</span>
            </h1>

            <p className="deposit-sub">
              Select coin package or enter manual amount. Minimum deposit is Rs 2,000.
            </p>

            <div className="secure-strip">
              <div className="secure-pill">
                <i className="fa-solid fa-bolt"></i>
                <b>Fast</b>
                <span>Processing</span>
              </div>
              <div className="secure-pill">
                <i className="fa-solid fa-lock"></i>
                <b>100%</b>
                <span>Secure</span>
              </div>
              <div className="secure-pill">
                <i className="fa-solid fa-coins"></i>
                <b>PKR</b>
                <span>Deposit</span>
              </div>
            </div>
          </section>

          <section className="deposit-card">
            <div className="card-title">
              <h2>Select Amount</h2>
              <span>Minimum Rs 2,000</span>
            </div>

            <form ref={formRef} method="POST" id="depositForm" onSubmit={handleSubmit}>
              <input type="hidden" name="_token" value="vQCyXQOxE2ooPIGfflrH3EtSxnZJO7rIB8vxWICI" />
              <input type="hidden" name="amount" id="amountInput" value={amount} />

              <div className="amount-grid">
                {amountOptions.map((optionAmount) => (
                  <label className="amount-option" key={optionAmount}>
                    <input
                      type="radio"
                      name="amount_option"
                      value={optionAmount}
                      defaultChecked={optionAmount === 2000}
                      onChange={handleAmountOptionChange}
                    />
                    <div className="amount-box">
                      <div className="coin-icon">
                        <i className="fa-solid fa-coins"></i>
                      </div>
                      <div>
                        <b>{optionAmount.toLocaleString()}</b>
                        <span>Coins Package</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="manual-box">
                <div className="manual-label">
                  Manual Amount
                  <span>Minimum Deposit Rs 2,000</span>
                </div>
                <input
                  type="number"
                  min="2000"
                  step="1"
                  id="manualAmount"
                  className="manual-input"
                  value={manualValue}
                  onChange={handleManualChange}
                  placeholder="Enter custom amount"
                />
              </div>

              <div className="card-title" style={{ marginTop: '18px', marginBottom: '12px' }}>
                <h2>Payment Method</h2>
                <span>Choose one</span>
              </div>

              <div className="method-grid">
                <label className="method-option">
                  <input
                    type="radio"
                    name="method"
                    value="Jazzcash_Direct"
                    defaultChecked
                    onChange={handleMethodChange}
                  />
                  <div className="method-card">
                    <img
                      src="https://vectorseek.com/wp-content/uploads/2020/12/vectorseek.com-Jazz-cash-logo-vector-300x148.png"
                      alt="JazzCash"
                    />
                    JazzCash
                  </div>
                </label>

                <label className="method-option">
                  <input
                    type="radio"
                    name="method"
                    value="Easypaisa_Direct"
                    onChange={handleMethodChange}
                  />
                  <div className="method-card">
                    <img
                      src="https://vectorseek.com/wp-content/uploads/2023/12/EASYPAISA-New-Logo-Vector.svg--300x161.png"
                      alt="Easypaisa"
                    />
                    Easypaisa
                  </div>
                </label>
              </div>

              <input
                type="tel"
                name="mobile"
                required
                inputMode="numeric"
                maxLength="13"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="03XXXXXXXXX"
                className="phone-input"
              />

              <button type="submit" className="submit-btn" id="submitBtn">
                <i className="fa-solid fa-coins"></i>
                Deposit Rs <span id="submitAmount">{amount.toLocaleString()}</span>
              </button>

              <div className="min-note">
                <i className="fa-solid fa-circle-check"></i>
                Minimum deposit 2000 hai. Manual amount 2000 se kam enter karne par form submit nahi hoga.
              </div>
            </form>
          </section>
        </main>

        <footer className="footer">
          <b><i className="fa-solid fa-lock"></i> 100% Secure Transaction</b>
          Premium Gaming Club payment gateway with fast JazzCash / Easypaisa processing.
        </footer>

        <nav className="bottom-nav">
          <a href="/home" className="nav-link">
            <i className="fa-solid fa-house-chimney"></i>
            <span>Home</span>
          </a>

          <a href="/deposit" className="nav-link active">
            <i className="fa-solid fa-circle-dollar-to-slot"></i>
            <span>Deposit</span>
          </a>

          <a href="/commission" className="center-btn">
            <i className="fa-solid fa-gift"></i>
          </a>

          <a href="/withdraw" className="nav-link">
            <i className="fa-solid fa-wallet"></i>
            <span>Withdraw</span>
          </a>

          <a href="/profile" className="nav-link">
            <i className="fa-solid fa-user-gear"></i>
            <span>Profile</span>
          </a>
        </nav>
      </div>

      <style jsx>{`
        :root {
          --void: #07020f;
          --panel: #150a28;
          --line: rgba(255, 255, 255, .11);
          --text: #fff8ef;
          --muted: #b9a8ce;
          --gold: #ffd166;
          --pink: #ff3d81;
          --violet: #7c3cff;
          --cyan: #28e7ff;
          --green: #37f59a;
          --shadow: 0 28px 80px rgba(0, 0, 0, .45);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        html,
        body {
          min-height: 100%;
          font-family: 'Space Grotesk', sans-serif;
          color: var(--text);
          background: var(--void);
          overflow-x: hidden;
        }

        body {
          padding-bottom: 118px;
        }

        body:before {
          content: "";
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at 15% 4%, rgba(255, 61, 129, .24), transparent 30%), radial-gradient(circle at 90% 8%, rgba(40, 231, 255, .20), transparent 26%), radial-gradient(circle at 50% 96%, rgba(124, 60, 255, .24), transparent 36%), linear-gradient(160deg, #07020f 0%, #140727 54%, #05040c 100%);
          z-index: -3;
        }

        body:after {
          content: "";
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(255, 255, 255, .032) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, .032) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: linear-gradient(to bottom, rgba(0, 0, 0, .85), transparent);
          z-index: -2;
        }

        a {
          text-decoration: none;
          color: inherit;
        }

        .app-shell {
          min-height: 100vh;
          position: relative;
        }

        .app-glow {
          position: fixed;
          width: 260px;
          height: 260px;
          border-radius: 999px;
          filter: blur(28px);
          opacity: .34;
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
          background: linear-gradient(to bottom, rgba(7, 2, 15, .95), rgba(7, 2, 15, .62));
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255, 255, 255, .07);
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

        .brand-logo img {
          height: 44px;
          max-width: 130px;
          object-fit: contain;
          filter: drop-shadow(0 0 14px rgba(255, 209, 102, .32));
        }

        .brand-copy {
          display: none;
        }

        .header-badge {
          height: 42px;
          padding: 0 14px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1a0614;
          font-size: 12px;
          font-weight: 900;
          background: linear-gradient(135deg, var(--gold), var(--pink));
          box-shadow: 0 16px 34px rgba(255, 61, 129, .24);
        }

        .content {
          width: 92%;
          max-width: 560px;
          margin: 18px auto 0;
        }

        .deposit-hero {
          position: relative;
          overflow: hidden;
          border-radius: 34px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(255, 209, 102, .18), rgba(255, 61, 129, .12), rgba(124, 60, 255, .20));
          border: 1px solid rgba(255, 255, 255, .11);
          box-shadow: var(--shadow);
        }

        .deposit-hero:before {
          content: "";
          position: absolute;
          width: 160px;
          height: 160px;
          right: -55px;
          top: -65px;
          border-radius: 999px;
          background: rgba(40, 231, 255, .18);
          filter: blur(4px);
        }

        .deposit-kicker {
          position: relative;
          width: max-content;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .10);
          border: 1px solid rgba(255, 255, 255, .13);
          color: var(--gold);
          font-size: 11px;
          font-weight: 900;
        }

        .deposit-title {
          position: relative;
          margin-top: 14px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 42px;
          line-height: .92;
          font-weight: 700;
          text-transform: uppercase;
        }

        .deposit-title span {
          color: var(--gold);
          text-shadow: 0 0 20px rgba(255, 209, 102, .42);
        }

        .deposit-sub {
          position: relative;
          max-width: 310px;
          margin-top: 10px;
          color: #eadff7;
          font-size: 13px;
          line-height: 1.5;
        }

        .secure-strip {
          position: relative;
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .secure-pill {
          min-height: 62px;
          padding: 10px 8px;
          border-radius: 18px;
          background: rgba(255, 255, 255, .08);
          border: 1px solid rgba(255, 255, 255, .09);
        }

        .secure-pill i {
          color: var(--gold);
          font-size: 15px;
        }

        .secure-pill b {
          display: block;
          margin-top: 6px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 18px;
        }

        .secure-pill span {
          display: block;
          color: var(--muted);
          font-size: 9px;
        }

        .deposit-card {
          margin-top: 16px;
          padding: 18px;
          border-radius: 32px;
          background: linear-gradient(180deg, rgba(255, 255, 255, .09), rgba(255, 255, 255, .035));
          border: 1px solid rgba(255, 255, 255, .10);
          box-shadow: var(--shadow);
        }

        .card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .card-title h2 {
          font-family: 'Rajdhani', sans-serif;
          font-size: 28px;
          line-height: 1;
        }

        .card-title span {
          font-size: 11px;
          color: var(--muted);
          font-weight: 800;
        }

        .amount-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .amount-option input {
          display: none;
        }

        .amount-box {
          min-height: 74px;
          border-radius: 22px;
          padding: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(145deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .035));
          border: 1px solid rgba(255, 255, 255, .10);
          cursor: pointer;
          transition: .22s;
        }

        .amount-option input:checked+.amount-box {
          border-color: rgba(255, 209, 102, .85);
          background: linear-gradient(135deg, rgba(255, 209, 102, .20), rgba(255, 61, 129, .14));
          box-shadow: 0 0 24px rgba(255, 209, 102, .18);
        }

        .coin-icon {
          width: 43px;
          height: 43px;
          min-width: 43px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #211006;
          font-size: 18px;
          background: radial-gradient(circle at 30% 25%, #fff7c2, #ffd166 42%, #c88416 100%);
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, .42), 0 8px 18px rgba(255, 209, 102, .22);
        }

        .amount-box b {
          display: block;
          font-family: 'Rajdhani', sans-serif;
          font-size: 24px;
          line-height: 1;
        }

        .amount-box span {
          display: block;
          margin-top: 4px;
          color: var(--muted);
          font-size: 10px;
          font-weight: 800;
        }

        .manual-box {
          margin-top: 14px;
          padding: 14px;
          border-radius: 24px;
          background: rgba(0, 0, 0, .16);
          border: 1px solid rgba(255, 255, 255, .09);
        }

        .manual-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }

        .manual-label span {
          color: var(--gold);
          font-size: 11px;
        }

        .manual-input {
          width: 100%;
          height: 56px;
          border: 0;
          outline: 0;
          border-radius: 18px;
          padding: 0 16px;
          color: #fff;
          font-size: 17px;
          font-weight: 800;
          background: rgba(255, 255, 255, .07);
          border: 1px solid rgba(255, 255, 255, .10);
        }

        .manual-input::placeholder {
          color: #9d8db4;
        }

        .method-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 14px;
        }

        .method-option input {
          display: none;
        }

        .method-card {
          min-height: 92px;
          border-radius: 22px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fff;
          color: #150a28;
          border: 2px solid transparent;
          cursor: pointer;
          transition: .22s;
          font-weight: 900;
        }

        .method-card img {
          height: 36px;
          max-width: 116px;
          object-fit: contain;
        }

        .method-option input:checked+.method-card {
          border-color: var(--gold);
          box-shadow: 0 0 24px rgba(255, 209, 102, .34);
          transform: translateY(-2px);
        }

        .phone-input {
          width: 100%;
          height: 56px;
          margin-top: 14px;
          border: 0;
          outline: 0;
          border-radius: 19px;
          padding: 0 16px;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          background: rgba(255, 255, 255, .07);
          border: 1px solid rgba(255, 255, 255, .10);
        }

        .phone-input::placeholder {
          color: #9d8db4;
        }

        .deposit-alert {
          margin-bottom: 14px;
          padding: 13px 14px;
          border-radius: 18px;
          background: rgba(255, 77, 109, .14);
          border: 1px solid rgba(255, 77, 109, .28);
          color: #ffd9e0;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.45;
        }

        .deposit-alert i {
          color: #ff4d6d;
          margin-right: 7px;
        }

        .submit-btn {
          width: 100%;
          height: 58px;
          margin-top: 14px;
          border: 0;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #1a0614;
          font-size: 15px;
          font-weight: 1000;
          background: linear-gradient(135deg, var(--gold), #ff9b3d 45%, var(--pink));
          box-shadow: 0 18px 38px rgba(255, 61, 129, .26);
          cursor: pointer;
        }

        .min-note {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(55, 245, 154, .10);
          border: 1px solid rgba(55, 245, 154, .14);
          color: #d9ffed;
          font-size: 12px;
          line-height: 1.45;
        }

        .min-note i {
          color: var(--green);
        }

        .footer {
          width: 92%;
          max-width: 560px;
          margin: 22px auto 0;
          padding: 20px;
          border-radius: 28px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, .09);
          background: rgba(255, 255, 255, .045);
          color: var(--muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .footer b {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--gold);
          font-size: 15px;
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
          background: rgba(12, 5, 25, .88);
          backdrop-filter: blur(22px);
          border: 1px solid rgba(255, 255, 255, .12);
          box-shadow: 0 22px 60px rgba(0, 0, 0, .52);
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
          box-shadow: 0 18px 40px rgba(255, 61, 129, .36);
          transform: rotate(45deg);
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
            font-family: 'Rajdhani', sans-serif;
            font-size: 22px;
            line-height: .95;
          }
          .brand-copy span {
            font-size: 10px;
            color: var(--muted);
          }
          .amount-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 430px) {
          .topbar {
            height: 80px;
            padding-inline: 12px;
          }
          .header-badge {
            height: 40px;
            padding: 0 11px;
            font-size: 11px;
          }
          .deposit-title {
            font-size: 37px;
          }
          .deposit-card {
            padding: 15px;
          }
          .amount-box {
            min-height: 70px;
            padding: 11px;
          }
          .amount-box b {
            font-size: 21px;
          }
          .coin-icon {
            width: 39px;
            height: 39px;
            min-width: 39px;
          }
        }
      `}</style>
    </>
  );
}
