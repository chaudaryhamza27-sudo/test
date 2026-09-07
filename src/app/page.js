"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { navTabs, categories, sections, winners, randomWinnerEntry } from "./data";
import BottomNav from "./components/BottomNav";
import {
  IconCoinWallet,
  IconSpeaker,
  IconChevronRight,
  IconSlots,
  IconLottery,
  IconCasino,
  IconRummy,
  IconFishing,
  IconHome,
  IconPlane,
  IconVip,
  IconWallet,
  IconGameAviator,
  IconGameOx,
  IconGameWheel,
  IconGameCards,
  IconGameCrown,
  IconGameFish,
  IconGameDragon,
  IconGrid,
  IconShield,
  IconLockLine,
  IconStar,
  IconHeadset,
  IconCheck,
  IconInfo,
  IconDocument,
  IconTrophy,
} from "./icons";

const HERO_BANNERS = ["/gamesall/banner1.webp", "/gamesall/banner2.webp", "/gamesall/banner3.webp"];

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

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [popup, setPopup] = useState(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [winnersOpen, setWinnersOpen] = useState(false);
  const [liveWinners, setLiveWinners] = useState(() => winners.map((w, i) => ({ ...w, id: i })));
  const winnerIdRef = useRef(winners.length);
  // undefined = auth check still in flight (render nothing in the header
  // slot to avoid a login/register flash before we know); null = logged
  // out; object = logged in.
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const t = setInterval(() => {
      setSlide((s) => (s + 1) % HERO_BANNERS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setLiveWinners((prev) => {
        const next = [{ ...randomWinnerEntry(), id: winnerIdRef.current++ }, ...prev];
        next.length = prev.length;
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const balance = user?.balance ?? 0;

  const openDemo = (name) => setPopup(name);
  const closeDemo = () => setPopup(null);

  const openRecharge = () => setRechargeOpen(true);
  const closeRecharge = () => setRechargeOpen(false);

  const scrollGames = (e, dir) => {
    const row = e.currentTarget.closest("section")?.querySelector(".kk-games");
    if (row) row.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: "smooth" });
  };

  const sectionId = (title) => `sec-${title.toLowerCase().replace(/\s+/g, "-")}`;

  // Category icon tap — smooth-scrolls down to that category's own section
  // further down the page instead of popping a demo dialog, matching how
  // the reference site's category row jumps straight to the section.
  const goToSection = (title) => {
    const el = document.getElementById(sectionId(title));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("kk-section-flash");
    setTimeout(() => el.classList.remove("kk-section-flash"), 900);
  };

  return (
    <div className="kk-page">
      <header className="kk-topbar">
        <Link href="/" className="kk-brand">
          <img src="/logo-mark.png" alt="Lucky73" className="kk-brand-logo" />
          <div className="kk-brand-copy">
            <span className="kk-brand-name">Lucky73</span>
            {/* <span className="kk-brand-tag">.online</span> */}
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

        {user === undefined ? (
          <div className="kk-header-right" style={{ visibility: "hidden" }} />
        ) : user ? (
          <div className="kk-header-right">
            <div className="kk-balance">
              <div className="kk-balance-icon">
                <IconCoinWallet />
              </div>
              <div className="kk-balance-text">
                <div className="kk-balance-label">Balance</div>
                <div className="kk-balance-value">Rs{Number(balance).toFixed(2)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="kk-header-auth">
            <Link href="/login" className="kk-header-login">Log in</Link>
            <Link href="/signup" className="kk-header-register">Register</Link>
          </div>
        )}
      </header>

      <main>
        <section className="kk-hero-row">
          <div className="kk-hero">
            <div className="kk-hero-slider" style={{ transform: `translateX(-${slide * 100}%)` }}>
              {HERO_BANNERS.map((src) => (
                <div key={src} className="kk-hero-slide photo" style={{ backgroundImage: `url("${src}")` }}>
                  <div className="kk-hero-copy">
                    <div className="kk-hero-kicker">
                      <IconVip style={{ width: 12, height: 12 }} />
                      VIP Gaming Lobby
                    </div>
                    <div className="kk-hero-title">
                      Play More
                      <br />
                      <b>Win Bigger</b>
                    </div>
                    <p className="kk-hero-sub">
                      New dark royal theme, faster game access, smooth mobile design and premium casino style.
                    </p>
                    <div className="kk-hero-actions">
                      <Link href="/crash" className="kk-hero-join-btn primary">
                        <IconPlane style={{ width: 13, height: 13 }} />
                        Play Aviator
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="kk-hero-dots">
              {HERO_BANNERS.map((_, i) => (
                <div key={i} className={`kk-dot ${i === slide ? "active" : ""}`} />
              ))}
            </div>
          </div>
        </section>

        <section className="kk-notice">
          <div className="kk-notice-icon kk-notice-icon-accent">
            <IconSpeaker />
          </div>
          <div className="kk-notice-text">
            Welcome to Lucky73, the most trusted and fastest site, you can play our games anytime,
            anywhere.
          </div>
          <button className="kk-notice-btn" onClick={() => openDemo("")}>
            <IconSpeaker style={{ width: 13, height: 13 }} />
            Detail
          </button>
        </section>

        <nav className="kk-cats">
          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon];
            const hasSection = sections.some((sec) => sec.title === c.label);
            return (
              <button
                key={c.key}
                className="kk-cat"
                onClick={() => (hasSection ? goToSection(c.label) : openDemo(c.label))}
              >
                <div className="kk-cat-icon" style={{ background: `linear-gradient(160deg, ${c.tint[0]}, ${c.tint[1]})` }}>
                  {c.img ? <img src={c.img} alt={c.label} className="kk-cat-icon-img" /> : Icon && <Icon />}
                </div>
                <span>{c.label}</span>
              </button>
            );
          })}
        </nav>

        {sections.map((sec) => (
          <section key={sec.title} id={sectionId(sec.title)} className="kk-section">
            <div className="kk-section-head">
              <h2 className="kk-section-title">
                {sec.title}
                {!sec.hideMore && <span className="kk-section-badge"></span>}
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
                const media = (
                  <>
                    <div className="kk-game-media" style={{ "--a": g.tint[0], "--b": g.tint[1] }}>
                      {g.badge && <span className={`kk-game-badge ${g.badge === "New" ? "new" : ""}`}>{g.badge}</span>}
                      {g.img ? (
                        <img className="kk-game-thumb" src={g.img} alt={g.name} />
                      ) : (
                        GameIcon && <GameIcon className="kk-game-icon" />
                      )}
                      {g.playable && (
                        <span className="kk-game-play">
                          <IconChevronRight style={{ width: 9, height: 9 }} />
                          Play
                        </span>
                      )}
                    </div>
                  </>
                );
                return g.playable ? (
                  <Link className="kk-game-card" key={g.name} href={g.href}>
                    {media}
                  </Link>
                ) : (
                  <button type="button" className="kk-game-card" key={g.name} onClick={openRecharge}>
                    {media}
                  </button>
                );
              })}
              {!sec.noDetail && (
                <Link href="/profile" className="kk-game-card detail">
                  <IconGrid />
                  <span>Detail</span>
                </Link>
              )}
            </div>
          </section>
        ))}

        <section className={`kk-winners ${winnersOpen ? "open" : ""}`} id="winnerBox">
          <div className="kk-winners-head">
            <div>
              <h3>Latest Winners</h3>
              <span>Masked Gmail list with recent winning amount</span>
            </div>
            <IconTrophy />
          </div>
          <table className="kk-winner-table">
            <thead><tr><th>Gmail</th><th style={{textAlign:"end"}}>Winning</th></tr></thead>
            <tbody>
              {liveWinners.map((w, i) => (
                <tr key={w.id} className={i >= 10 ? "kk-extra-winner" : ""}>
                  <td>{w.gmail}</td>
                  <td style={{textAlign:"end"}}>{w.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="kk-more-btn" onClick={() => setWinnersOpen(!winnersOpen)}>
            {winnersOpen ? "Show Less Winners" : "Show More Winners"}
          </button>
        </section>

        <div className="kk-section-head" style={{ padding: "18px 16px 8px" }}>
          <span className="kk-section-title" style={{ fontSize: 15 }}>Basic Tools</span>
        </div>
        <section className="card" style={{ margin: "0 16px", padding: "18px 8px" }}>
          <div className="kk-quick-actions" style={{ padding: "0 8px", justifyContent: "space-between" }}>
            <Link href="/support" className="kk-quick-action">
              <span className="kk-quick-action-icon" style={{ background: "#fff", border: "1px solid var(--border)", color: "#1565e8" }}>
                <IconHeadset />
              </span>
              <span>24/7 <br />Support</span>
            </Link>
            <Link href="/legal" className="kk-quick-action">
              <span className="kk-quick-action-icon" style={{ background: "#fff", border: "1px solid var(--border)", color: "#4a2fd6" }}>
                <IconInfo />
              </span>
              <span>About Us</span>
            </Link>
            <Link href="/legal/privacy" className="kk-quick-action">
              <span className="kk-quick-action-icon" style={{ background: "#fff", border: "1px solid var(--border)", color: "#1a9450" }}>
                <IconShield />
              </span>
              <span>Privacy Policy</span>
            </Link>
            <Link href="/legal/terms" className="kk-quick-action">
              <span className="kk-quick-action-icon" style={{ background: "#fff", border: "1px solid var(--border)", color: "#e8531b" }}>
                <IconDocument />
              </span>
              <span>Terms &amp; Conditions</span>
            </Link>
          </div>
        </section>

        <footer className="kk-footer-box">
          <div className="kk-footer-top">
            <div className="kk-footer-brand">
              <img src="/logo-mark.png" alt="Lucky73" />
              <span>Lucky73</span>
            </div>
            <div className="kk-age-badge">18+</div>
          </div>

          <div className="kk-footer-badges">
            <span className="kk-footer-badge"><IconShield />Fair Play Audited</span>
            <span className="kk-footer-badge"><IconLockLine />SSL Secured</span>
            {/* <span className="kk-footer-badge"><IconStar />Demo Credits Only</span> */}
            <span className="kk-footer-badge"><IconHeadset />24/7 Support</span>
          </div>

          <ul className="kk-footer-list">
            <li className="kk-footer-list-item">
              <IconCheck />
             The platform advocates fairness, justice, and openness. We mainly operate fair lottery, blockchain games, live casinos, and slot machine games.
            </li>
            <li className="kk-footer-list-item">
              <IconCheck />
             Lucky73 works with more than 10,000 online live game dealers and slot games, all of which are verified fair games.
            </li>
            <li className="kk-footer-list-item">
              <IconCheck />
             Lucky73 supports fast deposit and withdrawal, and looks forward to your visit.
            </li>
            
          </ul>

          {/* <div className="kk-footer-warning">
            Gambling can be addictive — please play responsibly. <b>Lucky73</b> only simulates
            access for users aged 18 and above.
          </div> */}
        </footer>
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeDemo}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">🎮</div>
          <div className="kk-popup-title">Practice Mode</div>
          <p className="kk-popup-text">
            &quot;{popup}&quot; is a placeholder tile in this UI showcase — no real game or wallet is connected.
          </p>
          <button className="kk-popup-btn" onClick={closeDemo}>
            Got it
          </button>
        </div>
      </div>

      <div className={`popup ${rechargeOpen ? "active" : ""}`} onClick={closeRecharge}>
        <div className="kk-popup-box recharge-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="recharge-popup-icon">
            <IconWallet />
          </div>
          <div className="kk-popup-title">Recharge Required</div>
          <p className="kk-popup-text">Please deposit balance to continue this game.</p>
          <Link href="/deposit" className="recharge-popup-btn">
            Recharge Now
          </Link>
        </div>
      </div>
    </div>
  );
}
