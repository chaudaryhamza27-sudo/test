'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [livePlayers, setLivePlayers] = useState(21388);
  const [winnersOpen, setWinnersOpen] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const heroSliderRef = useRef(null);
  const popupTimerRef = useRef(null);

  const notices = [
    'Welcome to Premium Gaming Club • Instant deposit • Fast withdraw • New games added • VIP bonus offers active',
    'Aviator and Wingo are live now • Play smart and enjoy smooth gaming experience',
    'Invite friends and unlock commission rewards • Support available 24/7',
    'New royal neon theme loaded • 40+ games in one premium lobby'
  ];

  useEffect(() => {
    // Hero slider auto-play
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 3200);

    // Notice ticker
    const noticeInterval = setInterval(() => {
      setNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 5000);

    // Live players counter
    const playersInterval = setInterval(() => {
      const value = Math.floor(Math.random() * (24900 - 15400 + 1)) + 15400;
      setLivePlayers(value);
    }, 2600);

    return () => {
      clearInterval(slideInterval);
      clearInterval(noticeInterval);
      clearInterval(playersInterval);
    };
  }, [notices.length]);

  useEffect(() => {
    // Update game card player counts after initial render
    document.querySelectorAll('.game-card').forEach(card => {
      const gameName = card.querySelector('.game-name')?.innerText?.toLowerCase() || '';
      const onlineText = card.querySelector('.game-online');
      if (!onlineText) return;

      let randomPlayers;
      if (gameName.includes('aviator') || gameName.includes('wingo') || gameName.includes('crash')) {
        randomPlayers = Math.floor(Math.random() * (9000 - 2200 + 1)) + 2200;
      } else if (gameName.includes('live') || gameName.includes('casino') || gameName.includes('baccarat')) {
        randomPlayers = Math.floor(Math.random() * (1800 - 650 + 1)) + 650;
      } else {
        randomPlayers = Math.floor(Math.random() * (850 - 260 + 1)) + 260;
      }

      onlineText.innerHTML = `<div class="online-dot"></div>${randomPlayers.toLocaleString()} Players Online`;
    });
  }, []);

  const showPopup = () => {
    setPopupVisible(true);
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }
    popupTimerRef.current = setTimeout(() => {
      setPopupVisible(false);
    }, 3000);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleWinners = () => {
    setWinnersOpen(!winnersOpen);
  };

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
              <div className="brand-copy"><b>PREMIUM</b><span>Gaming Club</span></div>
            </div>
          </div>
          <div className="top-right">
            <div className="wallet-pill">
              <div className="wallet-icon"><i className="fa-solid fa-coins"></i></div>
              <div>
                <span className="wallet-label">Balance</span>
                <div className="wallet-amount">PKR 0.00</div>
              </div>
              <i className="fa-solid fa-arrows-rotate" id="refreshBalance" onClick={() => window.location.reload()}></i>
            </div>
          </div>
        </header>

        <main className="content">
          <section className="hero">
            <div
              className="hero-slider"
              id="heroSlider"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              ref={heroSliderRef}
            >
              <div className="hero-slide"><img src="/images/pics/banner1.jpg" alt="Banner" /></div>
              <div className="hero-slide"><img src="/images/pics/banner2.jpg" alt="Banner" /></div>
              <div className="hero-slide"><img src="/images/pics/banner3.jpg" alt="Banner" /></div>
              <div className="hero-slide"><img src="/images/pics/banner4.jpg" alt="Banner" /></div>
            </div>
            <div className="hero-content">
              <div className="hero-kicker"><i className="fa-solid fa-crown"></i> VIP GAMING LOBBY</div>
              <h1 className="hero-title">Play More<br /><span>Win Bigger</span></h1>
              <p className="hero-sub">New dark royal theme, faster game access, smooth mobile design and premium casino style.</p>
              <div className="hero-actions">
                <Link href="/crash" className="hero-btn primary"><i className="fa-solid fa-play"></i> Play Aviator</Link>
                <a href="/data/wingoload.php" className="hero-btn ghost"><i className="fa-solid fa-bolt"></i> Wingo</a>
              </div>
            </div>
          </section>

          <section className="stats-strip">
            <div className="stat-card"><i className="fa-solid fa-users"></i><b id="livePlayers">{livePlayers.toLocaleString()}</b><span>Online players</span></div>
            <div className="stat-card"><i className="fa-solid fa-trophy"></i><b>40+</b><span>Games loaded</span></div>
            <div className="stat-card"><i className="fa-solid fa-shield-halved"></i><b>24/7</b><span>Support active</span></div>
          </section>

          <section className="quick-grid">
            <div className="quick-tile" onClick={() => scrollToSection('Hot Picks')}><i className="fa-solid fa-fire-flame-curved"></i><span>Hot</span></div>
            <div className="quick-tile" onClick={() => scrollToSection('Crash Zone')}><i className="fa-solid fa-rocket"></i><span>Crash</span></div>
            <div className="quick-tile" onClick={() => scrollToSection('Slots Arena')}><i className="fa-solid fa-gem"></i><span>Slots</span></div>
            <div className="quick-tile" onClick={() => scrollToSection('Sports Hub')}><i className="fa-solid fa-futbol"></i><span>Sports</span></div>
          </section>

          <section className="apk-showcase">
            <div className="apk-badge">
              <i className="fa-solid fa-mobile-screen-button"></i>
            </div>

            <div className="apk-content">
              <div className="apk-chip">ANDROID APP</div>
              <h3>Download Premium APK</h3>
              <p>Install the latest app for smoother gameplay, faster loading and quick access.</p>
            </div>

            <a href="/pk92.apk" download className="apk-btn">
              <i className="fa-solid fa-download"></i>
              Download
            </a>
          </section>

          <section className="ticker">
            <div className="ticker-label"><i className="fa-solid fa-bullhorn"></i> Notice</div>
            <div className="ticker-track"><div className="ticker-text" id="noticeText">{notices[noticeIndex]}</div></div>
          </section>

          <section className="section" id="Hot Picks">
            <div className="section-head">
              <h2 className="section-title">Hot Picks</h2>
              <span className="view-all">Swipe to view</span>
            </div>
            <div className="games">
              <a href="/crash" className="game-card">
                <div className="game-media">
                  <span className="badge">LIVE</span>
                  <img src="/images/gamepics/avaitor.png" className="game-thumb" alt="Aviator" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Aviator</div>
                  <div className="game-online"><div className="online-dot"></div>8,178 Players Online</div>
                </div>
              </a>
              <a href="/data/wingoload.php" className="game-card">
                <div className="game-media">
                  <span className="badge">HOT</span>
                  <img src="https://wingolottery.app/wp-content/uploads/2025/12/Wingo-Lottery-favicon.webp" className="game-thumb" alt="Wingo" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Wingo</div>
                  <div className="game-online"><div className="online-dot"></div>3,739 Players Online</div>
                </div>
              </a>
            </div>
          </section>

          <section className="section" id="Crash Zone">
            <div className="section-head">
              <h2 className="section-title">Crash Zone</h2>
              <span className="view-all">Swipe to view</span>
            </div>
            <div className="games">
              <a href="/crash" className="game-card">
                <div className="game-media">
                  <span className="badge">REAL</span>
                  <img src="/images/gamepics/avaitor.png" className="game-thumb" alt="Aviator Pro" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Aviator Pro</div>
                  <div className="game-online"><div className="online-dot"></div>6,118 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">NEW</span>
                  <img src="/images/gamepics/7updown.png" className="game-thumb" alt="JetX" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">JetX</div>
                  <div className="game-online"><div className="online-dot"></div>760 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">FAST</span>
                  <img src="/images/gamepics/plinko.png" className="game-thumb" alt="Rocket Rush" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Rocket Rush</div>
                  <div className="game-online"><div className="online-dot"></div>451 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">HOT</span>
                  <img src="/images/gamepics/98.png" className="game-thumb" alt="Cash Rocket" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Cash Rocket</div>
                  <div className="game-online"><div className="online-dot"></div>840 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">NEW</span>
                  <img src="/images/gamepics/63.png" className="game-thumb" alt="Sky Pilot" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Sky Pilot</div>
                  <div className="game-online"><div className="online-dot"></div>698 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">FAST</span>
                  <img src="/images/gamepics/happyfish.jpg" className="game-thumb" alt="Turbo Crash" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Turbo Crash</div>
                  <div className="game-online"><div className="online-dot"></div>4,659 Players Online</div>
                </div>
              </a>
            </div>
          </section>

          <section className="section" id="Slots Arena">
            <div className="section-head">
              <h2 className="section-title">Slots Arena</h2>
              <span className="view-all">Swipe to view</span>
            </div>
            <div className="games">
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">PG</span>
                  <img src="/images/gamepics/mines.png" className="game-thumb" alt="Fortune Ox" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Fortune Ox</div>
                  <div className="game-online"><div className="online-dot"></div>826 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">PG</span>
                  <img src="/images/gamepics/roullete.png" className="game-thumb" alt="Fortune Dragon" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Fortune Dragon</div>
                  <div className="game-online"><div className="online-dot"></div>846 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">PG</span>
                  <img src="/images/gamepics/63.png" className="game-thumb" alt="Fortune Rabbit" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Fortune Rabbit</div>
                  <div className="game-online"><div className="online-dot"></div>825 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">HOT</span>
                  <img src="/images/gamepics/98.png" className="game-thumb" alt="Cash Mania" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Cash Mania</div>
                  <div className="game-online"><div className="online-dot"></div>600 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">NEW</span>
                  <img src="/images/gamepics/megafish.jpg" className="game-thumb" alt="Golden Empire" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Golden Empire</div>
                  <div className="game-online"><div className="online-dot"></div>645 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">HOT</span>
                  <img src="/images/gamepics/happyfish.jpg" className="game-thumb" alt="Mega Fortune" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Mega Fortune</div>
                  <div className="game-online"><div className="online-dot"></div>545 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">NEW</span>
                  <img src="/images/gamepics/jdb.jpg" className="game-thumb" alt="Lucky Gems" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Lucky Gems</div>
                  <div className="game-online"><div className="online-dot"></div>756 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">SLOT</span>
                  <img src="/images/gamepics/jili.png" className="game-thumb" alt="Fruit Party" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Fruit Party</div>
                  <div className="game-online"><div className="online-dot"></div>423 Players Online</div>
                </div>
              </a>
            </div>
          </section>

          <section className="section" id="Live Casino">
            <div className="section-head">
              <h2 className="section-title">Live Casino</h2>
              <span className="view-all">Swipe to view</span>
            </div>
            <div className="games">
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">LIVE</span>
                  <img src="/images/gamepics/megafish.jpg" className="game-thumb" alt="Crazy Time" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Crazy Time</div>
                  <div className="game-online"><div className="online-dot"></div>560 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">LIVE</span>
                  <img src="/images/gamepics/happyfish.jpg" className="game-thumb" alt="Mega Ace" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Mega Ace</div>
                  <div className="game-online"><div className="online-dot"></div>725 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">LIVE</span>
                  <img src="/images/gamepics/jdb.jpg" className="game-thumb" alt="JDB Casino" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">JDB Casino</div>
                  <div className="game-online"><div className="online-dot"></div>671 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">LIVE</span>
                  <img src="/images/gamepics/jili.png" className="game-thumb" alt="JILI Club" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">JILI Club</div>
                  <div className="game-online"><div className="online-dot"></div>287 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">VIP</span>
                  <img src="/images/gamepics/roullete.png" className="game-thumb" alt="Baccarat" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Baccarat</div>
                  <div className="game-online"><div className="online-dot"></div>700 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">VIP</span>
                  <img src="/images/gamepics/7updown.png" className="game-thumb" alt="Blackjack" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Blackjack</div>
                  <div className="game-online"><div className="online-dot"></div>289 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">LIVE</span>
                  <img src="/images/gamepics/plinko.png" className="game-thumb" alt="Sic Bo" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Sic Bo</div>
                  <div className="game-online"><div className="online-dot"></div>311 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">NEW</span>
                  <img src="/images/gamepics/tigerdragon.jpg" className="game-thumb" alt="Dream Catcher" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Dream Catcher</div>
                  <div className="game-online"><div className="online-dot"></div>547 Players Online</div>
                </div>
              </a>
            </div>
          </section>

          <section className="section" id="Sports Hub">
            <div className="section-head">
              <h2 className="section-title">Sports Hub</h2>
              <span className="view-all">Swipe to view</span>
            </div>
            <div className="games">
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">MATCH</span>
                  <img src="/images/gamepics/7updown.png" className="game-thumb" alt="Cricket" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Cricket</div>
                  <div className="game-online"><div className="online-dot"></div>279 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">SPORT</span>
                  <img src="/images/gamepics/plinko.png" className="game-thumb" alt="Penalty" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Penalty</div>
                  <div className="game-online"><div className="online-dot"></div>463 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">LIVE</span>
                  <img src="/images/gamepics/tigerdragon.jpg" className="game-thumb" alt="Football" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Football</div>
                  <div className="game-online"><div className="online-dot"></div>829 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">FAST</span>
                  <img src="/images/gamepics/63.png" className="game-thumb" alt="Horse Racing" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Horse Racing</div>
                  <div className="game-online"><div className="online-dot"></div>613 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">LIVE</span>
                  <img src="/images/gamepics/98.png" className="game-thumb" alt="Basketball" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Basketball</div>
                  <div className="game-online"><div className="online-dot"></div>540 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">LIVE</span>
                  <img src="/images/gamepics/happyfish.jpg" className="game-thumb" alt="Tennis" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Tennis</div>
                  <div className="game-online"><div className="online-dot"></div>734 Players Online</div>
                </div>
              </a>
            </div>
          </section>

          <section className="section" id="Arcade Plus">
            <div className="section-head">
              <h2 className="section-title">Arcade Plus</h2>
              <span className="view-all">Swipe to view</span>
            </div>
            <div className="games">
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">FUN</span>
                  <img src="/images/gamepics/plinko.png" className="game-thumb" alt="Plinko" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Plinko</div>
                  <div className="game-online"><div className="online-dot"></div>357 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">FAST</span>
                  <img src="/images/gamepics/7updown.png" className="game-thumb" alt="7 Up Down" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">7 Up Down</div>
                  <div className="game-online"><div className="online-dot"></div>720 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">NEW</span>
                  <img src="/images/gamepics/megafish.jpg" className="game-thumb" alt="Fish Hunter" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Fish Hunter</div>
                  <div className="game-online"><div className="online-dot"></div>420 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">FUN</span>
                  <img src="/images/gamepics/happyfish.jpg" className="game-thumb" alt="Happy Fish" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Happy Fish</div>
                  <div className="game-online"><div className="online-dot"></div>844 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">HOT</span>
                  <img src="/images/gamepics/roullete.png" className="game-thumb" alt="Color Prediction" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Color Prediction</div>
                  <div className="game-online"><div className="online-dot"></div>731 Players Online</div>
                </div>
              </a>
              <a href="javascript:void(0)" onClick={showPopup} className="game-card">
                <div className="game-media">
                  <span className="badge">FAST</span>
                  <img src="/images/gamepics/mines.png" className="game-thumb" alt="Dice Duel" />
                  <span className="play-orb"><i className="fa-solid fa-play"></i></span>
                </div>
                <div className="game-info">
                  <div className="game-name">Dice Duel</div>
                  <div className="game-online"><div className="online-dot"></div>663 Players Online</div>
                </div>
              </a>
            </div>
          </section>

          <section className="promo-wrap">
            <div className="promo-card">
              <h3>VIP Bonus Room</h3>
              <p>Deposit, play and unlock premium rewards with a cleaner, richer mobile experience.</p>
              <a href="/deposit"><i className="fa-solid fa-wallet"></i> Recharge Now</a>
            </div>
            <div className="promo-card">
              <h3>Fast Support</h3>
              <p>Need help? Contact customer support anytime from the support page.</p>
              <a href="/profile"><i className="fa-solid fa-headset"></i> Get Support</a>
            </div>
          </section>

          <section className={`winners ${winnersOpen ? 'open' : ''}`} id="winnerBox">
            <div className="winners-head">
              <div>
                <h3>Latest Winners</h3>
                <span>Masked Gmail list with recent winning amount</span>
              </div>
              <i className="fa-solid fa-ranking-star"></i>
            </div>
            <table className="winner-table">
              <thead><tr><th>Gmail</th><th>Winning</th></tr></thead>
              <tbody>
                <tr className=""><td>ali***@gmail.com</td><td>PKR 18,450</td></tr>
                <tr className=""><td>ham***@gmail.com</td><td>PKR 31,200</td></tr>
                <tr className=""><td>ran***@gmail.com</td><td>PKR 9,780</td></tr>
                <tr className=""><td>dev***@gmail.com</td><td>PKR 52,100</td></tr>
                <tr className=""><td>sha***@gmail.com</td><td>PKR 12,900</td></tr>
                <tr className=""><td>kin***@gmail.com</td><td>PKR 66,340</td></tr>
                <tr className=""><td>zub***@gmail.com</td><td>PKR 7,600</td></tr>
                <tr className=""><td>noo***@gmail.com</td><td>PKR 44,220</td></tr>
                <tr className=""><td>far***@gmail.com</td><td>PKR 21,070</td></tr>
                <tr className=""><td>mir***@gmail.com</td><td>PKR 88,800</td></tr>
                <tr className="extra-winner"><td>pak***@gmail.com</td><td>PKR 5,430</td></tr>
                <tr className="extra-winner"><td>sam***@gmail.com</td><td>PKR 72,310</td></tr>
                <tr className="extra-winner"><td>rai***@gmail.com</td><td>PKR 16,990</td></tr>
                <tr className="extra-winner"><td>ars***@gmail.com</td><td>PKR 33,140</td></tr>
                <tr className="extra-winner"><td>wah***@gmail.com</td><td>PKR 11,860</td></tr>
                <tr className="extra-winner"><td>tal***@gmail.com</td><td>PKR 27,450</td></tr>
                <tr className="extra-winner"><td>ane***@gmail.com</td><td>PKR 91,000</td></tr>
                <tr className="extra-winner"><td>ima***@gmail.com</td><td>PKR 14,720</td></tr>
                <tr className="extra-winner"><td>kam***@gmail.com</td><td>PKR 39,990</td></tr>
                <tr className="extra-winner"><td>yus***@gmail.com</td><td>PKR 22,200</td></tr>
                <tr className="extra-winner"><td>bil***@gmail.com</td><td>PKR 6,870</td></tr>
                <tr className="extra-winner"><td>dan***@gmail.com</td><td>PKR 19,030</td></tr>
                <tr className="extra-winner"><td>uma***@gmail.com</td><td>PKR 41,500</td></tr>
                <tr className="extra-winner"><td>sad***@gmail.com</td><td>PKR 8,230</td></tr>
                <tr className="extra-winner"><td>haf***@gmail.com</td><td>PKR 63,750</td></tr>
                <tr className="extra-winner"><td>nim***@gmail.com</td><td>PKR 25,100</td></tr>
                <tr className="extra-winner"><td>irf***@gmail.com</td><td>PKR 30,600</td></tr>
                <tr className="extra-winner"><td>zan***@gmail.com</td><td>PKR 13,440</td></tr>
                <tr className="extra-winner"><td>abd***@gmail.com</td><td>PKR 75,900</td></tr>
                <tr className="extra-winner"><td>yas***@gmail.com</td><td>PKR 17,650</td></tr>
                <tr className="extra-winner"><td>raf***@gmail.com</td><td>PKR 49,870</td></tr>
                <tr className="extra-winner"><td>sai***@gmail.com</td><td>PKR 10,050</td></tr>
                <tr className="extra-winner"><td>jaw***@gmail.com</td><td>PKR 58,320</td></tr>
                <tr className="extra-winner"><td>bas***@gmail.com</td><td>PKR 34,780</td></tr>
                <tr className="extra-winner"><td>mun***@gmail.com</td><td>PKR 23,910</td></tr>
                <tr className="extra-winner"><td>qur***@gmail.com</td><td>PKR 15,560</td></tr>
                <tr className="extra-winner"><td>zia***@gmail.com</td><td>PKR 81,400</td></tr>
                <tr className="extra-winner"><td>ade***@gmail.com</td><td>PKR 28,300</td></tr>
                <tr className="extra-winner"><td>mah***@gmail.com</td><td>PKR 36,900</td></tr>
                <tr className="extra-winner"><td>ria***@gmail.com</td><td>PKR 20,810</td></tr>
                <tr className="extra-winner"><td>azl***@gmail.com</td><td>PKR 67,700</td></tr>
                <tr className="extra-winner"><td>har***@gmail.com</td><td>PKR 9,260</td></tr>
                <tr className="extra-winner"><td>mel***@gmail.com</td><td>PKR 45,510</td></tr>
                <tr className="extra-winner"><td>zee***@gmail.com</td><td>PKR 24,660</td></tr>
                <tr className="extra-winner"><td>aaq***@gmail.com</td><td>PKR 12,350</td></tr>
                <tr className="extra-winner"><td>ars***@gmail.com</td><td>PKR 79,900</td></tr>
                <tr className="extra-winner"><td>naq***@gmail.com</td><td>PKR 18,870</td></tr>
                <tr className="extra-winner"><td>faz***@gmail.com</td><td>PKR 55,120</td></tr>
                <tr className="extra-winner"><td>hum***@gmail.com</td><td>PKR 29,990</td></tr>
                <tr className="extra-winner"><td>sha***@gmail.com</td><td>PKR 101,300</td></tr>
                <tr className="extra-winner"><td>zoh***@gmail.com</td><td>PKR 38,500</td></tr>
                <tr className="extra-winner"><td>rab***@gmail.com</td><td>PKR 11,110</td></tr>
                <tr className="extra-winner"><td>sab***@gmail.com</td><td>PKR 60,600</td></tr>
                <tr className="extra-winner"><td>mal***@gmail.com</td><td>PKR 42,220</td></tr>
                <tr className="extra-winner"><td>was***@gmail.com</td><td>PKR 26,760</td></tr>
                <tr className="extra-winner"><td>omi***@gmail.com</td><td>PKR 19,940</td></tr>
                <tr className="extra-winner"><td>jib***@gmail.com</td><td>PKR 31,870</td></tr>
                <tr className="extra-winner"><td>tam***@gmail.com</td><td>PKR 57,450</td></tr>
                <tr className="extra-winner"><td>man***@gmail.com</td><td>PKR 14,190</td></tr>
                <tr className="extra-winner"><td>nas***@gmail.com</td><td>PKR 70,010</td></tr>
              </tbody>
            </table>
            <button type="button" className="more-btn" id="moreWinnersBtn" onClick={toggleWinners}>
              {winnersOpen ? 'Show Less Winners' : 'Show More Winners'}
            </button>
          </section>

          <footer className="footer">
            <b>Premium Gaming Club</b><br />
            © 2026 All Rights Reserved.
          </footer>
        </main>

        <div className={`popup ${popupVisible ? 'active' : ''}`} id="popup">
          <div className="popup-box">
            <div className="popup-icon"><i className="fa-solid fa-wallet"></i></div>
            <div className="popup-title">Recharge Required</div>
            <div className="popup-text">Please deposit balance to continue this game.</div>
            <button className="popup-btn" onClick={() => window.location.href = '/deposit'}>Recharge Now</button>
          </div>
        </div>

        <nav className="bottom-nav">
          <a href="/home" className="nav-link active"><i className="fa-solid fa-house-chimney"></i><span>Home</span></a>
          <a href="/deposit" className="nav-link"><i className="fa-solid fa-circle-dollar-to-slot"></i><span>Deposit</span></a>
          <a href="/commission" className="center-btn"><i className="fa-solid fa-gift"></i></a>
          <a href="/withdraw" className="nav-link"><i className="fa-solid fa-wallet"></i><span>Withdraw</span></a>
          <a href="/profile" className="nav-link"><i className="fa-solid fa-user-gear"></i><span>Profile</span></a>
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
          --danger: #ff5c5c;
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
          padding: 14px 0 0;
        }
        .hero {
          margin: 4px 14px 18px;
          border-radius: 32px;
          min-height: 270px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow);
          background: linear-gradient(135deg, #241047, #090414);
          border: 1px solid rgba(255, 255, 255, .10);
        }
        .hero-slider {
          display: flex;
          height: 270px;
          transition: .7s cubic-bezier(.2, .8, .2, 1);
        }
        .hero-slide {
          min-width: 100%;
          height: 100%;
          position: relative;
        }
        .hero-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: .72;
        }
        .hero:before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(7, 2, 15, .92), rgba(7, 2, 15, .22) 62%, rgba(7, 2, 15, .72));
          z-index: 1;
        }
        .hero:after {
          content: "";
          position: absolute;
          right: -38px;
          bottom: -50px;
          width: 170px;
          height: 170px;
          border-radius: 50%;
          border: 34px solid rgba(255, 209, 102, .13);
          z-index: 1;
        }
        .hero-content {
          position: absolute;
          inset: 0;
          z-index: 2;
          padding: 25px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .hero-kicker {
          width: max-content;
          padding: 8px 13px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .12);
          border: 1px solid rgba(255, 255, 255, .12);
          color: var(--gold);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .5px;
        }
        .hero-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 43px;
          font-weight: 700;
          line-height: .9;
          margin-top: 13px;
          text-transform: uppercase;
        }
        .hero-title span {
          color: var(--gold);
          text-shadow: 0 0 22px rgba(255, 209, 102, .45);
        }
        .hero-sub {
          max-width: 260px;
          margin-top: 12px;
          color: #e8dff3;
          font-size: 13px;
          line-height: 1.45;
        }
        .hero-actions {
          margin-top: 18px;
          display: flex;
          gap: 10px;
        }
        .hero-btn {
          height: 44px;
          padding: 0 16px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
        }
        .hero-btn.primary {
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          box-shadow: 0 14px 30px rgba(40, 231, 255, .24);
        }
        .hero-btn.ghost {
          background: rgba(255, 255, 255, .09);
          border: 1px solid rgba(255, 255, 255, .12);
        }
        .stats-strip {
          margin: 0 14px 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .stat-card {
          min-height: 76px;
          border-radius: 22px;
          padding: 13px 10px;
          background: linear-gradient(180deg, rgba(255, 255, 255, .09), rgba(255, 255, 255, .035));
          border: 1px solid rgba(255, 255, 255, .09);
          box-shadow: 0 18px 38px rgba(0, 0, 0, .24);
        }
        .stat-card i {
          color: var(--gold);
          font-size: 15px;
        }
        .stat-card b {
          display: block;
          margin-top: 7px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 21px;
          line-height: 1;
        }
        .stat-card span {
          font-size: 10px;
          color: var(--muted);
        }
        .quick-grid {
          padding: 0 14px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .quick-tile {
          height: 88px;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, rgba(124, 60, 255, .23), rgba(255, 61, 129, .08));
          border: 1px solid rgba(255, 255, 255, .10);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
        }
        .quick-tile:before {
          content: "";
          position: absolute;
          inset: auto -30% -42% auto;
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: rgba(255, 209, 102, .13);
        }
        .quick-tile i {
          font-size: 24px;
          color: var(--gold);
        }
        .quick-tile span {
          font-size: 11px;
          font-weight: 800;
          color: #f6edff;
        }
        .apk-showcase {
          margin: 18px 14px 0;
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          padding: 18px;
          min-height: 124px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(255, 255, 255, .16);
          background: radial-gradient(circle at 18% 15%, rgba(255, 209, 102, .35), transparent 30%), radial-gradient(circle at 86% 25%, rgba(40, 231, 255, .32), transparent 28%), linear-gradient(135deg, rgba(255, 61, 129, .24), rgba(124, 60, 255, .25) 48%, rgba(7, 2, 15, .92));
          box-shadow: 0 24px 70px rgba(0, 0, 0, .42), inset 0 1px 0 rgba(255, 255, 255, .18);
        }
        .apk-showcase:before {
          content: "";
          position: absolute;
          inset: -1px;
          background: linear-gradient(120deg, transparent, rgba(255, 255, 255, .20), transparent);
          transform: translateX(-80%);
          animation: apkShine 4.6s ease-in-out infinite;
        }
        .apk-showcase:after {
          content: "";
          position: absolute;
          right: -42px;
          bottom: -54px;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 28px solid rgba(255, 255, 255, .07);
        }
        @keyframes apkShine {
          0%,
          45% {
            transform: translateX(-90%);
          }
          70%,
          100% {
            transform: translateX(120%);
          }
        }
        .apk-badge {
          position: relative;
          z-index: 2;
          width: 66px;
          height: 66px;
          min-width: 66px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, var(--gold), #ff8b3d, var(--pink));
          color: #180511;
          font-size: 28px;
          box-shadow: 0 16px 35px rgba(255, 61, 129, .35);
        }
        .apk-content {
          position: relative;
          z-index: 2;
          flex: 1;
        }
        .apk-chip {
          width: max-content;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(0, 0, 0, .24);
          border: 1px solid rgba(255, 255, 255, .13);
          color: var(--gold);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .5px;
          margin-bottom: 7px;
        }
        .apk-content h3 {
          font-family: 'Rajdhani', sans-serif;
          font-size: 27px;
          line-height: 1;
          margin: 0;
          color: #fff;
        }
        .apk-content p {
          margin-top: 6px;
          color: #efe4ff;
          font-size: 12px;
          line-height: 1.45;
        }
        .apk-btn {
          position: relative;
          z-index: 2;
          min-width: 104px;
          height: 46px;
          padding: 0 15px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: #fff;
          color: #170516;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 14px 28px rgba(0, 0, 0, .25);
        }
        .apk-btn:active {
          transform: scale(.96);
        }
        .ticker {
          margin: 17px 14px;
          border-radius: 22px;
          height: 56px;
          overflow: hidden;
          display: flex;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, .10);
          background: linear-gradient(90deg, rgba(255, 61, 129, .15), rgba(40, 231, 255, .10));
        }
        .ticker-label {
          height: 100%;
          padding: 0 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, .22);
          color: var(--gold);
          font-size: 12px;
          font-weight: 800;
        }
        .ticker-track {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
        }
        .ticker-text {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 17s linear infinite;
          color: #efe4ff;
          font-size: 12px;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .section {
          margin-top: 25px;
        }
        .section-head {
          padding: 0 16px 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .section-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 25px;
          font-weight: 700;
          letter-spacing: .2px;
        }
        .section-title:before {
          content: "";
          display: inline-block;
          width: 9px;
          height: 23px;
          border-radius: 999px;
          background: linear-gradient(var(--gold), var(--pink));
          margin-right: 8px;
          vertical-align: -4px;
        }
        .view-all {
          font-size: 12px;
          color: var(--muted);
          font-weight: 700;
        }
        .games {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 154px;
          gap: 13px;
          overflow-x: auto;
          padding: 0 14px 6px;
          scroll-snap-type: x mandatory;
        }
        .games::-webkit-scrollbar {
          display: none;
        }
        .game-card {
          scroll-snap-align: start;
          min-height: 214px;
          border-radius: 27px;
          overflow: hidden;
          position: relative;
          background: linear-gradient(180deg, rgba(255, 255, 255, .10), rgba(255, 255, 255, .04));
          border: 1px solid rgba(255, 255, 255, .10);
          box-shadow: 0 20px 44px rgba(0, 0, 0, .30);
          transition: .22s;
        }
        .game-card:active {
          transform: scale(.96);
        }
        .game-media {
          height: 142px;
          position: relative;
          overflow: hidden;
          background: #140727;
        }
        .game-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: .3s;
        }
        .game-card:hover .game-thumb {
          transform: scale(1.08);
        }
        .game-media:after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 42%, rgba(7, 2, 15, .88));
        }
        .badge {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
          background: linear-gradient(135deg, var(--gold), var(--pink));
          color: #1a0614;
          letter-spacing: .4px;
        }
        .play-orb {
          position: absolute;
          right: 10px;
          bottom: 10px;
          z-index: 2;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, .16);
          border: 1px solid rgba(255, 255, 255, .18);
          backdrop-filter: blur(8px);
        }
        .game-info {
          padding: 12px 12px 14px;
        }
        .game-name {
          font-size: 14px;
          font-weight: 800;
          line-height: 1.1;
        }
        .game-online {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          color: #c9fbe2;
        }
        .online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 13px var(--green);
        }
        .promo-wrap {
          margin: 26px 14px 0;
          display: grid;
          gap: 12px;
        }
        .promo-card {
          border-radius: 30px;
          padding: 20px;
          min-height: 150px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, .10);
          background: linear-gradient(135deg, rgba(255, 209, 102, .20), rgba(255, 61, 129, .13), rgba(124, 60, 255, .15));
          box-shadow: var(--shadow);
        }
        .promo-card:before {
          content: "";
          position: absolute;
          right: -38px;
          top: -44px;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: rgba(255, 255, 255, .10);
        }
        .promo-card h3 {
          font-family: 'Rajdhani', sans-serif;
          font-size: 30px;
          line-height: 1;
        }
        .promo-card p {
          margin-top: 8px;
          max-width: 250px;
          color: #eadff7;
          font-size: 13px;
          line-height: 1.5;
        }
        .promo-card a {
          margin-top: 16px;
          width: max-content;
          height: 42px;
          border-radius: 15px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          color: #1b0617;
          font-size: 12px;
          font-weight: 900;
        }
        .winners {
          margin: 26px 14px 0;
          border-radius: 30px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(255, 255, 255, .09), rgba(255, 255, 255, .035));
          border: 1px solid rgba(255, 255, 255, .10);
          box-shadow: var(--shadow);
        }
        .winners-head {
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(90deg, rgba(255, 209, 102, .14), rgba(255, 61, 129, .10));
        }
        .winners-head h3 {
          font-family: 'Rajdhani', sans-serif;
          font-size: 27px;
          line-height: 1;
        }
        .winners-head span {
          font-size: 11px;
          color: var(--muted);
        }
        .winner-table {
          width: 100%;
          border-collapse: collapse;
        }
        .winner-table th,
        .winner-table td {
          padding: 13px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, .07);
          font-size: 12px;
        }
        .winner-table th {
          color: var(--gold);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .5px;
        }
        .winner-table td:last-child {
          font-weight: 800;
          color: var(--green);
          text-align: right;
        }
        .extra-winner {
          display: none;
        }
        .winners.open .extra-winner {
          display: table-row;
        }
        .more-btn {
          width: calc(100% - 28px);
          margin: 14px;
          height: 48px;
          border: 0;
          border-radius: 17px;
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          color: #fff;
          font-weight: 900;
          font-size: 13px;
          cursor: pointer;
        }
        .footer {
          margin: 24px 14px 0;
          padding: 22px;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, .09);
          background: rgba(255, 255, 255, .045);
          color: var(--muted);
          font-size: 12px;
          line-height: 1.7;
          text-align: center;
        }
        .footer b {
          color: var(--gold);
        }
        .popup {
          position: fixed;
          inset: 0;
          z-index: 5000;
          background: rgba(0, 0, 0, .76);
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .popup.active {
          display: flex;
        }
        .popup-box {
          width: 100%;
          max-width: 365px;
          border-radius: 32px;
          padding: 26px 22px;
          text-align: center;
          background: linear-gradient(180deg, #21103e, #0b0617);
          border: 1px solid rgba(255, 255, 255, .13);
          box-shadow: var(--shadow);
        }
        .popup-icon {
          width: 78px;
          height: 78px;
          margin: 0 auto 16px;
          border-radius: 27px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, var(--gold), var(--pink));
          color: #190511;
          font-size: 31px;
        }
        .popup-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 32px;
          font-weight: 700;
        }
        .popup-text {
          margin-top: 7px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
        }
        .popup-btn {
          margin-top: 20px;
          width: 100%;
          height: 52px;
          border: 0;
          border-radius: 18px;
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          color: #fff;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
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
          .content {
            max-width: 980px;
            margin: 0 auto;
          }
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
          .promo-wrap {
            grid-template-columns: 1fr 1fr;
          }
          .games {
            grid-auto-columns: 176px;
          }
          .game-media {
            height: 156px;
          }
          .hero {
            min-height: 330px;
          }
          .hero-slider {
            height: 330px;
          }
          .hero-title {
            font-size: 58px;
          }
        }
        @media (max-width: 430px) {
          .apk-showcase {
            padding: 15px;
            gap: 12px;
          }
          .apk-badge {
            width: 58px;
            height: 58px;
            min-width: 58px;
            border-radius: 20px;
            font-size: 24px;
          }
          .apk-content h3 {
            font-size: 23px;
          }
          .apk-content p {
            font-size: 11px;
          }
          .apk-btn {
            min-width: 88px;
            height: 42px;
            padding: 0 12px;
            font-size: 11px;
          }
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
          .top-cta {
            padding: 0 13px;
          }
          .hero {
            min-height: 250px;
          }
          .hero-slider {
            height: 250px;
          }
          .hero-title {
            font-size: 37px;
          }
          .stats-strip {
            gap: 8px;
          }
          .stat-card {
            padding: 11px 8px;
          }
          .quick-grid {
            gap: 8px;
          }
          .quick-tile {
            height: 82px;
          }
          .games {
            grid-auto-columns: 146px;
          }
          .game-media {
            height: 136px;
          }
          .winner-table th,
          .winner-table td {
            padding: 12px 13px;
          }
        }
      `}</style>
    </>
  );
}