'use client';

import { useState, useEffect } from 'react';

export default function Profile() {
  const [supportNumber, setSupportNumber] = useState('+923377224726');
  const [uid] = useState('3082');
  const [email] = useState('ah7a33n07@gmail.com');
  const [balance] = useState('0.00');

  useEffect(() => {
    // Fetch support number from API
    fetch('/data/support.json')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const number = data.whatsapp_number || '00000000';
        const cleanNumber = String(number).replace(/[^0-9]/g, '');
        const formatted = '+' + cleanNumber;
        setSupportNumber(formatted);
      })
      .catch(() => {
        // Fallback number
        setSupportNumber('+923430163290');
      });
  }, []);

  const refreshBalance = () => {
    window.location.reload();
  };

  const copyInvite = () => {
    const input = document.getElementById('inviteLink');
    if (input) {
      input.select();
      input.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(input.value);
      alert('Invite link copied!');
    }
  };

  const copyUid = () => {
    navigator.clipboard.writeText(uid);
    alert('UID copied!');
  };

  const cleanNumber = supportNumber.replace(/[^0-9]/g, '');
  const whatsappMessage = encodeURIComponent(`Hello support, I need help with my account. UID: ${uid}`);

  return (
    <>
      <div className="app-shell">
        <div className="app-glow g1"></div>
        <div className="app-glow g2"></div>
        <div className="app-glow g3"></div>

        <header className="topbar">
          <div className="top-left">
            <div className="brand-logo">
              <img src="/images/pics/mainlogo.png" alt="Logo" />
              <div className="brand-copy">
                <b>PREMIUM</b>
                <span>Gaming Club</span>
              </div>
            </div>
          </div>

          <div className="top-right">
            <div className="wallet-pill">
              <div className="wallet-icon">
                <i className="fa-solid fa-coins"></i>
              </div>
              <div>
                <span className="wallet-label">Balance</span>
                <div className="wallet-amount">PKR {balance}</div>
              </div>
              <i className="fa-solid fa-arrows-rotate" id="refreshBalance" onClick={refreshBalance}></i>
            </div>
          </div>
        </header>

        <main className="content">
          <section className="profile-hero">
            <div className="profile-row">
              <div className="avatar-ring">
                <img src="/images/icons/icon2.jpg" className="profile-avatar" alt="User" />
              </div>

              <div className="profile-info">
                <div className="vip-chip">
                  <i className="fa-solid fa-crown"></i> PREMIUM USER
                </div>
                <div className="profile-email">{email}</div>
                <div className="profile-uid">UID: <b>{uid}</b></div>
              </div>
            </div>

            <div className="health-front">
              <div className="health-head">
                <span><i className="fa-solid fa-shield-heart"></i> Account Health</span>
                <b>10%</b>
              </div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{ width: '10%' }}></div>
              </div>
              <div className="health-note">Your account is active and verified for smooth gaming access.</div>
            </div>

            <div className="balance-mini">
              <div className="balance-box">
                <span>Available Balance</span>
                <b>PKR {balance}</b>
              </div>
              <button className="copy-mini" type="button" onClick={copyUid} title="Copy UID">
                <i className="fa-regular fa-copy"></i>
              </button>
            </div>
          </section>

          <section className="action-grid">
            <a href="/deposit" className="dash-action deposit">
              <i className="fa-solid fa-arrow-down-long"></i>
              <span>Deposit</span>
            </a>
            <a href="/withdraw" className="dash-action withdraw">
              <i className="fa-solid fa-arrow-up-long"></i>
              <span>Withdraw</span>
            </a>
            <a href="/history" className="dash-action history">
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>History</span>
            </a>
          </section>

          <section className="support-canvas">
            <div className="support-head">
              <div className="support-icon">
                <i className="fa-brands fa-whatsapp"></i>
              </div>
              <div className="support-title">
                <h3>Support Center</h3>
                <p>Fast help, payment issue, account support and game guidance.</p>
              </div>
            </div>

            <div className="support-number">
              <div>
                <span>WhatsApp Number</span>
                <b id="supportNumberText">{supportNumber}</b>
              </div>
              <i className="fa-solid fa-headset"></i>
            </div>

            <a
              href={`https://wa.me/${cleanNumber}?text=${whatsappMessage}`}
              id="supportWhatsappBtn"
              className="support-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-whatsapp"></i>
              Chat on WhatsApp
            </a>
          </section>

          <section className="invite-card">
            <div className="invite-title">
              <i className="fa-solid fa-share-nodes"></i> Invite &amp; Earn
            </div>
            <div className="invite-row">
              <input
                type="text"
                id="inviteLink"
                value="https://pk92.site/register?refer=22E210B1"
                readOnly
              />
              <button type="button" onClick={copyInvite}>Copy</button>
            </div>
          </section>

          <section className="menu-section">
            <a href="/data/terms.php" className="menu-card">
              <div className="menu-left">
                <i className="fa-solid fa-file-shield"></i>
                <span>Terms &amp; Conditions</span>
              </div>
              <small>Open</small>
            </a>

            <a href="/pk92.apk" download className="menu-card download-apk">
              <div className="menu-left">
                <i className="fa-solid fa-download"></i>
                <span>Download APK</span>
              </div>
              <small>Latest</small>
            </a>

            <a href="/logout" className="menu-card logout-card">
              <div className="menu-left">
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Logout Account</span>
              </div>
              <small>Exit</small>
            </a>
          </section>

          <div className="footer-note">
            <b>Premium Gaming Club</b><br />
            Secure Account, PK92 Sheild Active.
          </div>
        </main>

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
          <a href="/withdraw" className="nav-link">
            <i className="fa-solid fa-wallet"></i>
            <span>Withdraw</span>
          </a>
          <a href="/profile" className="nav-link active">
            <i className="fa-solid fa-user-gear"></i>
            <span>Profile</span>
          </a>
        </nav>
      </div>

      <style jsx>{`
        :root {
          --void: #07020f;
          --ink: #0f061d;
          --panel: #150a28;
          --panel2: #20113b;
          --line: rgba(255, 255, 255, .11);
          --text: #fff8ef;
          --muted: #b9a8ce;
          --gold: #ffd166;
          --pink: #ff3d81;
          --violet: #7c3cff;
          --cyan: #28e7ff;
          --green: #37f59a;
          --danger: #ff4d6d;
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
          padding-bottom: 118px;
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

        /* HOME STYLE HEADER */
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
        .wallet-pill {
          height: 48px;
          min-width: 132px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 0 10px;
          border: 1px solid rgba(255, 209, 102, .25);
          background: linear-gradient(135deg, rgba(255, 209, 102, .18), rgba(255, 61, 129, .10));
          box-shadow: 0 14px 34px rgba(0, 0, 0, .28);
        }
        .wallet-icon {
          width: 31px;
          height: 31px;
          border-radius: 12px;
          background: rgba(0, 0, 0, .22);
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
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.05;
        }
        .top-cta {
          height: 48px;
          padding: 0 17px;
          border-radius: 18px;
          background: linear-gradient(135deg, var(--gold), #ff8b3d 45%, var(--pink));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #180511;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 16px 34px rgba(255, 61, 129, .30);
        }

        .content {
          padding: 16px 14px 0;
          max-width: 980px;
          margin: 0 auto;
        }
        .profile-hero {
          position: relative;
          overflow: hidden;
          border-radius: 34px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, .11);
          background: linear-gradient(145deg, rgba(255, 209, 102, .16), rgba(255, 61, 129, .12), rgba(124, 60, 255, .18));
          box-shadow: var(--shadow);
        }
        .profile-hero:before {
          content: "";
          position: absolute;
          right: -65px;
          top: -75px;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          background: rgba(255, 255, 255, .10);
        }
        .profile-hero:after {
          content: "";
          position: absolute;
          left: -70px;
          bottom: -90px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(40, 231, 255, .10);
          filter: blur(2px);
        }
        .profile-row {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .avatar-ring {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          padding: 4px;
          background: conic-gradient(from 120deg, var(--gold), var(--pink), var(--cyan), var(--gold));
          box-shadow: 0 0 28px rgba(255, 209, 102, .22);
        }
        .profile-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #12081f;
          background: #12081f;
        }
        .profile-info {
          min-width: 0;
          flex: 1;
        }
        .vip-chip {
          width: max-content;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .12);
          border: 1px solid rgba(255, 255, 255, .12);
          color: var(--gold);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .5px;
        }
        .profile-email {
          margin-top: 10px;
          font-size: 15px;
          font-weight: 900;
          word-break: break-word;
        }
        .profile-uid {
          margin-top: 5px;
          color: #eadff7;
          font-size: 12px;
        }
        .profile-uid b {
          color: var(--cyan);
        }
        .health-front {
          position: relative;
          z-index: 2;
          margin-top: 18px;
          padding: 15px;
          border-radius: 22px;
          background: rgba(0, 0, 0, .23);
          border: 1px solid rgba(255, 255, 255, .10);
          backdrop-filter: blur(14px);
        }
        .health-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 11px;
        }
        .health-head span {
          font-size: 12px;
          color: #eadff7;
          font-weight: 800;
        }
        .health-head b {
          font-family: 'Rajdhani', sans-serif;
          font-size: 23px;
          color: var(--green);
        }
        .progress-wrap {
          height: 13px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .08);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--green), var(--cyan), var(--violet));
          box-shadow: 0 0 20px rgba(55, 245, 154, .32);
        }
        .health-note {
          margin-top: 9px;
          font-size: 10px;
          color: var(--muted);
        }
        .balance-mini {
          margin-top: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .balance-box {
          flex: 1;
          padding: 14px 15px;
          border-radius: 21px;
          background: rgba(255, 255, 255, .08);
          border: 1px solid rgba(255, 255, 255, .10);
        }
        .balance-box span {
          display: block;
          color: var(--muted);
          font-size: 10px;
        }
        .balance-box b {
          display: block;
          margin-top: 3px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 27px;
          color: #fff;
        }
        .copy-mini {
          width: 48px;
          height: 48px;
          border: 0;
          border-radius: 17px;
          color: #160515;
          background: linear-gradient(135deg, var(--gold), var(--pink));
          font-size: 17px;
          box-shadow: 0 14px 32px rgba(255, 61, 129, .24);
          cursor: pointer;
        }

        .action-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .dash-action {
          min-height: 92px;
          border-radius: 25px;
          padding: 14px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          background: linear-gradient(180deg, rgba(255, 255, 255, .09), rgba(255, 255, 255, .035));
          border: 1px solid rgba(255, 255, 255, .10);
          box-shadow: 0 18px 38px rgba(0, 0, 0, .24);
          font-size: 12px;
          font-weight: 900;
        }
        .dash-action i {
          width: 38px;
          height: 38px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          font-size: 17px;
        }
        .dash-action.deposit i {
          background: linear-gradient(135deg, var(--gold), var(--pink));
          color: #170512;
        }
        .dash-action.history i {
          background: linear-gradient(135deg, #37f59a, var(--cyan));
          color: #07120c;
        }
        .dash-action:active,
        .menu-card:active,
        .support-btn:active {
          transform: scale(.97);
        }

        .support-canvas {
          margin-top: 18px;
          position: relative;
          overflow: hidden;
          border-radius: 32px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(37, 211, 102, .18), rgba(40, 231, 255, .11), rgba(124, 60, 255, .15));
          border: 1px solid rgba(255, 255, 255, .11);
          box-shadow: var(--shadow);
        }
        .support-canvas:before {
          content: "";
          position: absolute;
          right: -45px;
          top: -45px;
          width: 145px;
          height: 145px;
          border-radius: 50%;
          background: rgba(37, 211, 102, .18);
        }
        .support-head {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 13px;
        }
        .support-icon {
          width: 58px;
          height: 58px;
          border-radius: 21px;
          display: grid;
          place-items: center;
          background: #25D366;
          color: #fff;
          font-size: 30px;
          box-shadow: 0 18px 36px rgba(37, 211, 102, .28);
        }
        .support-title h3 {
          font-family: 'Rajdhani', sans-serif;
          font-size: 30px;
          line-height: .95;
        }
        .support-title p {
          margin-top: 5px;
          font-size: 12px;
          color: #e7dbf7;
        }
        .support-number {
          position: relative;
          z-index: 2;
          margin-top: 16px;
          padding: 14px 15px;
          border-radius: 20px;
          background: rgba(0, 0, 0, .25);
          border: 1px solid rgba(255, 255, 255, .10);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .support-number span {
          font-size: 11px;
          color: var(--muted);
        }
        .support-number b {
          display: block;
          margin-top: 3px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 24px;
          color: #fff;
        }
        .support-btn {
          position: relative;
          z-index: 2;
          margin-top: 14px;
          height: 50px;
          border-radius: 18px;
          background: #25D366;
          color: #fff;
          font-weight: 900;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          box-shadow: 0 16px 34px rgba(37, 211, 102, .23);
        }

        .menu-section {
          margin-top: 18px;
          display: grid;
          gap: 11px;
        }
        .menu-card {
          min-height: 58px;
          border-radius: 21px;
          padding: 0 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: linear-gradient(180deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .035));
          border: 1px solid rgba(255, 255, 255, .10);
          box-shadow: 0 14px 34px rgba(0, 0, 0, .20);
          transition: .22s;
        }
        .menu-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .menu-left i {
          width: 39px;
          height: 39px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, .09);
          color: var(--gold);
        }
        .menu-left span {
          font-size: 13px;
          font-weight: 900;
        }
        .menu-card small {
          color: var(--muted);
          font-size: 11px;
        }
        .download-apk {
          background: linear-gradient(135deg, rgba(255, 209, 102, .18), rgba(255, 61, 129, .13), rgba(40, 231, 255, .10));
        }
        .logout-card {
          background: linear-gradient(135deg, rgba(255, 77, 109, .20), rgba(255, 61, 129, .09));
          border-color: rgba(255, 77, 109, .18);
        }
        .logout-card .menu-left i {
          color: #fff;
          background: linear-gradient(135deg, #ff4d6d, #ff0033);
        }
        .invite-card {
          margin-top: 18px;
          border-radius: 28px;
          padding: 16px;
          background: rgba(255, 255, 255, .055);
          border: 1px solid rgba(255, 255, 255, .09);
        }
        .invite-title {
          font-size: 13px;
          font-weight: 900;
          color: var(--gold);
          margin-bottom: 11px;
        }
        .invite-row {
          display: flex;
          gap: 9px;
        }
        .invite-row input {
          min-width: 0;
          flex: 1;
          height: 47px;
          border: 0;
          outline: 0;
          border-radius: 16px;
          background: rgba(0, 0, 0, .24);
          color: #fff;
          padding: 0 13px;
          font-size: 11px;
        }
        .invite-row button {
          border: 0;
          border-radius: 16px;
          padding: 0 15px;
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          color: #fff;
          font-weight: 900;
          cursor: pointer;
        }
        .footer-note {
          margin-top: 18px;
          text-align: center;
          color: var(--muted);
          font-size: 11px;
          line-height: 1.7;
        }
        .footer-note b {
          color: var(--gold);
        }

        /* HOME STYLE BOTTOM NAV */
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
          .profile-hero {
            padding: 24px;
          }
          .profile-email {
            font-size: 18px;
          }
          .menu-section {
            grid-template-columns: 1fr 1fr;
          }
          .support-canvas {
            padding: 24px;
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
            padding-inline: 12px;
          }
          .profile-hero {
            border-radius: 29px;
            padding: 17px;
          }
          .avatar-ring {
            width: 74px;
            height: 74px;
          }
          .profile-email {
            font-size: 13px;
          }
          .action-grid {
            gap: 8px;
          }
          .dash-action {
            min-height: 86px;
            border-radius: 22px;
          }
          .support-title h3 {
            font-size: 27px;
          }
          .support-number b {
            font-size: 21px;
          }
          .bottom-nav {
            height: 72px;
            bottom: 10px;
            border-radius: 27px;
          }
          .center-btn {
            width: 60px;
            height: 60px;
            margin-top: -32px;
          }
        }
      `}</style>
    </>
  );
}