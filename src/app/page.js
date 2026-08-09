"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { heroSlides, categories, sections } from "./data";
import BottomNav from "./components/BottomNav";
import NotificationBell from "./components/NotificationBell";
import {
  IconEagle,
  IconCoinWallet,
  IconSpeaker,
  IconChevronRight,
  IconSlots,
  IconLottery,
  IconCasino,
  IconRummy,
  IconFishing,
} from "./icons";

const CATEGORY_ICONS = {
  IconSlots,
  IconLottery,
  IconCasino,
  IconRummy,
  IconFishing,
};

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [popup, setPopup] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      setSlide((s) => (s + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBalance(data.user.balance))
      .catch(() => setBalance(null));
  }, []);

  const openDemo = (name) => setPopup(name);
  const closeDemo = () => setPopup(null);

  return (
    <div className="kk-page">
      <header className="kk-topbar">
        <div className="kk-brand">
          <IconEagle className="kk-brand-logo" />
          <span className="kk-brand-name">PK92</span>
        </div>
        <div className="kk-balance">
          <div className="kk-balance-icon">
            <IconCoinWallet />
          </div>
          <div className="kk-balance-text">
            <div className="kk-balance-label">Balance</div>
            <div className="kk-balance-value">Rs{Number(balance ?? 0).toFixed(2)}</div>
          </div>
          <NotificationBell />
        </div>
      </header>

      <main>
        <section className="kk-hero">
          <div className="kk-hero-slider" style={{ transform: `translateX(-${slide * 100}%)` }}>
            {heroSlides.map((s, i) => (
              <div key={i} className="kk-hero-slide" style={{ "--a": s.a, "--b": s.b }}>
                <IconEagle className="kk-hero-eagle" />
                <div className="kk-hero-title">
                  Join Our Official
                  <br />
                  <b>Channel Now!</b>
                </div>
                <div className="kk-hero-brand">PK92</div>
                <div className="kk-hero-pill" onClick={() => openDemo("Official Channel")}>
                  <span className="kk-hero-pill-icon">
                    <IconSpeaker style={{ width: 12, height: 12 }} />
                  </span>
                  <span>There is a daily gift code waiting for you!!</span>
                </div>
              </div>
            ))}
          </div>
          <div className="kk-hero-dots">
            {heroSlides.map((_, i) => (
              <div key={i} className={`kk-dot ${i === slide ? "active" : ""}`} />
            ))}
          </div>
        </section>

        <section className="kk-notice">
          <div className="kk-notice-icon">
            <IconSpeaker />
          </div>
          <div className="kk-notice-text">
            Welcome to PK92, the most trusted and fastest site, you can play our games there
            anytime, anywhere.
          </div>
          <button className="kk-notice-btn" onClick={() => openDemo("Notice")}>
            <IconSpeaker style={{ width: 13, height: 13 }} />
            Detail
          </button>
        </section>

        <nav className="kk-cats">
          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon];
            return (
              <button key={c.key} className="kk-cat" onClick={() => openDemo(c.label)}>
                <div className="kk-cat-icon" style={{ background: `linear-gradient(160deg, ${c.tint[0]}, ${c.tint[1]})` }}>
                  {Icon && <Icon />}
                </div>
                <span>{c.label}</span>
              </button>
            );
          })}
        </nav>

        {sections.map((sec) => (
          <section key={sec.title}>
            <div className="kk-section-head">
              <h2 className="kk-section-title">
                {sec.title}
                <span className="kk-section-badge">More 4</span>
              </h2>
              <div className="kk-arrow-group">
                <button className="kk-arrow-btn" aria-label="Previous">
                  <IconChevronRight style={{ transform: "rotate(180deg)" }} />
                </button>
                <button className="kk-arrow-btn" aria-label="Next">
                  <IconChevronRight />
                </button>
              </div>
            </div>
            <p className="kk-section-sub">{sec.subtitle}</p>
            <div className="kk-games">
              {sec.games.map((g) => {
                const media = (
                  <>
                    <div className="kk-game-media" style={{ "--a": g.tint[0], "--b": g.tint[1] }}>
                      {g.href ? "✈️" : "🎮"}
                    </div>
                    <div className="kk-game-info">
                      <div className="kk-game-name">{g.name}</div>
                      <div className="kk-game-tag">{g.tag}</div>
                    </div>
                  </>
                );
                return g.href ? (
                  <Link className="kk-game-card" key={g.name} href={g.href}>
                    {media}
                  </Link>
                ) : (
                  <div className="kk-game-card" key={g.name} onClick={() => openDemo(g.name)}>
                    {media}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <footer className="kk-footer">PK92 — UI design preview. No real balance or games are connected.</footer>
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeDemo}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">🎮</div>
          <div className="kk-popup-title">Demo Mode</div>
          <p className="kk-popup-text">
            &quot;{popup}&quot; is a placeholder tile in this UI showcase — no real game or wallet is connected.
          </p>
          <button className="kk-popup-btn" onClick={closeDemo}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
