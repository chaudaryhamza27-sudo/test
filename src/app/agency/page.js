"use client";

import { useState } from "react";
import BottomNav from "../components/BottomNav";
import { IconWallet, IconQr } from "../icons";

const STATS = [
  { key: "register", label: "number of register" },
  { key: "depositNumber", label: "Deposit number", tone: "green" },
  { key: "depositAmount", label: "Deposit amount", tone: "orange" },
  { key: "firstDeposit", label: "Number of people making first deposit" },
];

export default function AgencyPage() {
  const [tab, setTab] = useState("direct");
  const [popup, setPopup] = useState(null);

  const values = {
    direct: { register: 0, depositNumber: 0, depositAmount: 0, firstDeposit: 0 },
    team: { register: 0, depositNumber: 0, depositAmount: 0, firstDeposit: 0 },
  };

  return (
    <div className="kk-page">
      <header className="kk-header">
        <span className="kk-header-side" />
        <span className="kk-header-title">Agency</span>
        <button className="kk-header-icon-btn" onClick={() => setPopup("Agency records")}>
          <IconWallet />
        </button>
      </header>

      <main>
        <section className="kk-agency-banner">
          <div className="big">0</div>
          <div className="pill">Yesterday&apos;s total commission</div>
          <div className="note">Upgrade the level to increase commission income</div>
        </section>

        <div className="kk-agency-tabs">
          <button className={`kk-agency-tab ${tab === "direct" ? "active" : ""}`} onClick={() => setTab("direct")}>
            Direct subordinates
          </button>
          <button className={`kk-agency-tab ${tab === "team" ? "active" : ""}`} onClick={() => setTab("team")}>
            Team subordinates
          </button>
        </div>

        <section className="kk-agency-stats">
          <div className="kk-agency-col">
            {STATS.map((s) => (
              <div className={`kk-agency-stat ${s.tone || ""}`} key={s.key}>
                <b>{values.direct[s.key]}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="kk-agency-col">
            {STATS.map((s) => (
              <div className={`kk-agency-stat ${s.tone || ""}`} key={s.key}>
                <b>{values.team[s.key]}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <button className="kk-qr-btn" onClick={() => setPopup("Download QR Code")}>
          <IconQr />
          Download QR Code
        </button>

        <footer className="kk-footer">Invite friends and earn commission on every deposit they make.</footer>
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={() => setPopup(null)}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">🤝</div>
          <div className="kk-popup-title">Demo Mode</div>
          <p className="kk-popup-text">&quot;{popup}&quot; is a placeholder in this UI showcase — no real agency data is connected.</p>
          <button className="kk-popup-btn" onClick={() => setPopup(null)}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
