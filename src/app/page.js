"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { heroSlides, navTabs, categories, sections, TAG_ICONS } from "./data";
import BottomNav from "./components/BottomNav";
import NotificationBell from "./components/NotificationBell";
import ProfileMenu from "./components/ProfileMenu";
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
  IconHome,
  IconGift,
  IconCopy,
  IconPlane,
  IconInfo,
  IconGameAviator,
  IconGameOx,
  IconGameWheel,
  IconGameCards,
  IconGameCrown,
  IconGameFish,
  IconGameDragon,
} from "./icons";

const CATEGORY_ICONS = {
  IconHome,
  IconSlots,
  IconLottery,
  IconCasino,
  IconRummy,
  IconFishing,
};

const GAME_ICONS = {
  IconGameAviator,
  IconGameOx,
  IconGameWheel,
  IconGameCards,
  IconGameCrown,
  IconGameFish,
  IconGameDragon,
};

const DAILY_CODE = "PK92DAILY";

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

  const [codeCopied, setCodeCopied] = useState(false);

  const openDemo = (name) => setPopup(name);
  const closeDemo = () => setPopup(null);

  const copyCode = () => {
    navigator.clipboard?.writeText(DAILY_CODE).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const scrollGames = (e, dir) => {
    const row = e.currentTarget.closest("section")?.querySelector(".kk-games");
    if (row) row.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="kk-page">
      <header className="kk-topbar">
        <Link href="/" className="kk-brand">
          <IconEagle className="kk-brand-logo" />
          <div className="kk-brand-copy">
            <span className="kk-brand-name">PK92</span>
            <span className="kk-brand-tag">Aviator — Simulation</span>
          </div>
        </Link>

        <nav className="kk-nav-tabs">
          {navTabs.map((t) => {
            const Icon = CATEGORY_ICONS[t.icon];
            const label = (
              <>
                {Icon && <Icon />}
                <span>{t.label}</span>
              </>
            );
            return t.href ? (
              <Link key={t.key} href={t.href} className={`kk-nav-tab ${t.key === "home" ? "active" : ""}`}>
                {label}
              </Link>
            ) : (
              <button key={t.key} type="button" className="kk-nav-tab" onClick={() => openDemo(t.label)}>
                {label}
              </button>
            );
          })}
        </nav>

        <div className="kk-header-right">
          <div className="kk-balance">
            <div className="kk-balance-icon">
              <IconCoinWallet />
            </div>
            <div className="kk-balance-text">
              <div className="kk-balance-label">Balance</div>
              <div className="kk-balance-value">Rs{Number(balance ?? 0).toFixed(2)}</div>
            </div>
          </div>
          <NotificationBell />
          <ProfileMenu />
        </div>
      </header>

      <main>
        <section className="kk-hero-row">
          <div className="kk-hero">
            <div className="kk-hero-slider" style={{ transform: `translateX(-${slide * 100}%)` }}>
              {heroSlides.map((s, i) => (
                <div key={i} className="kk-hero-slide" style={{ "--a": s.a, "--b": s.b }}>
                  <div className="kk-hero-copy">
                    <div className="kk-hero-title">
                      Join Our Official
                      <br />
                      <b>Channel Now!</b>
                    </div>
                    <div className="kk-hero-brand">— PK92 —</div>
                    <button type="button" className="kk-hero-join-btn" onClick={() => openDemo("Official Channel")}>
                      <IconPlane style={{ width: 13, height: 13 }} />
                      Join Now
                    </button>
                  </div>
                  <div className="kk-hero-plane-wrap">
                    <IconPlane className="kk-hero-plane" />
                  </div>
                </div>
              ))}
            </div>
            <div className="kk-hero-dots">
              {heroSlides.map((_, i) => (
                <div key={i} className={`kk-dot ${i === slide ? "active" : ""}`} />
              ))}
            </div>
          </div>

          <div className="kk-gift-card">
            <div className="kk-gift-head">
              <div className="kk-gift-icon">
                <IconGift />
              </div>
              Daily Gift
            </div>
            <p className="kk-gift-desc">There is a daily gift code waiting for you!</p>
            <div className="kk-gift-code">
              <span>{DAILY_CODE}</span>
              <button type="button" onClick={copyCode} aria-label="Copy code">
                <IconCopy />
              </button>
            </div>
            <p className="kk-gift-note">{codeCopied ? "Copied!" : "Redeem and enjoy rewards every day!"}</p>
            <button type="button" className="kk-gift-btn" onClick={() => openDemo("Daily Gift")}>
              <IconGift style={{ width: 14, height: 14 }} />
              Claim Gift
            </button>
          </div>
        </section>

        <section className="kk-notice">
          <div className="kk-notice-icon kk-notice-icon-accent">
            <IconSpeaker />
          </div>
          <div className="kk-notice-text">
            Welcome to PK92, the most trusted and fastest site, you can play our games anytime,
            anywhere.
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
                <button className="kk-arrow-btn" aria-label="Previous" onClick={(e) => scrollGames(e, -1)}>
                  <IconChevronRight style={{ transform: "rotate(180deg)" }} />
                </button>
                <button className="kk-arrow-btn" aria-label="Next" onClick={(e) => scrollGames(e, 1)}>
                  <IconChevronRight />
                </button>
              </div>
            </div>
            <p className="kk-section-sub">{sec.subtitle}</p>
            <div className="kk-games">
              {sec.games.map((g) => {
                const GameIcon = GAME_ICONS[g.icon];
                const TagIcon = CATEGORY_ICONS[TAG_ICONS[g.tag]];
                const media = (
                  <>
                    <div className="kk-game-media" style={{ "--a": g.tint[0], "--b": g.tint[1] }}>
                      {g.badge && <span className={`kk-game-badge ${g.badge === "New" ? "new" : ""}`}>{g.badge}</span>}
                      {GameIcon && <GameIcon className="kk-game-icon" />}
                    </div>
                    <div className="kk-game-info">
                      <div className="kk-game-name">{g.name}</div>
                      <div className="kk-game-tag">
                        {TagIcon && <TagIcon />}
                        <span>{g.tag}</span>
                      </div>
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

        <footer className="kk-info-bar">
          <div className="kk-info-bar-icon">
            <IconInfo />
          </div>
          <p>
            PK92 is an educational simulation. Your balance and the Aviator game are real and
            backend-connected — but every credit is a demo credit with no real value.
          </p>
        </footer>
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
