'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CrashStage from './CrashStage';
import BetPanel from './BetPanel';
import { useGameSocket } from './useGameSocket';
import AppShellHeader from '../components/AppShellHeader';
import { useSound } from '../components/SoundProvider';
import { IconHistory, IconHeadset, IconChevronRight } from '../icons';
import depositStyles from '../deposit/deposit.module.css';
import './crash.css';

/*
 * The stage receives the authoritative game state over Socket.IO (with REST
 * polling as its automatic fallback if the realtime server is unavailable).
 *
 * The old wiring notes below predate the Socket.IO integration:
 *   1. useCrashRound({ source: 'server' })  — SSE from /api/game/stream
 *   2. replace placeBet / cashOut below with POSTs to your existing routes
 *   3. take `balance` from the wallet rather than local state
 * The three handlers are the only places that need to change.
 */

// "All Bets" is a simulated public feed, same as the rest of this demo's
// play-money data — there is no real multi-user backend behind it.
const randUser = () => {
  const letter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `${letter()}${letter()}${digits}`;
};

const makeFeedRow = () => {
  const stake = Math.round((Math.random() * 4000 + 20) * 100) / 100;
  const running = Math.random() < 0.35;
  const at = Math.round((1 + Math.random() * 9) * 100) / 100;
  return {
    id: Math.random().toString(36).slice(2),
    user: randUser(),
    stake,
    at,
    running,
    // Always a real settled payout — whether a row actually reads "Running"
    // is decided at render time from the live round phase, not baked in here.
    payout: Math.round(stake * at * 100) / 100,
  };
};

const FEED_PAGE = 15;

// Placeholder round history shown only until the DB has real finished
// rounds — same random-multiplier spread as the simulated bets feed above,
// purely cosmetic so the strip isn't blank on a fresh install.
const makeDummyHistory = (n = 10) =>
  Array.from({ length: n }, () => Math.round((1 + Math.random() * 9) * 100) / 100);

const TIERS = [
  { max: 2, bg: '#005d91', fg: '#afd9ed' },
  { max: 10, bg: '#900087', fg: '#e9c2e7' },
  { max: Infinity, bg: '#1b955c', fg: '#d7c3eb' },
];
const badgeStyle = (m) => {
  const t = TIERS.find((tier) => m < tier.max) || TIERS[TIERS.length - 1];
  return { background: t.bg, color: t.fg };
};

// One independent betting box: its own stake/bet/history, sharing only the
// round clock and the wallet balance. Two of these render side by side so a
// player can run two bets at once, each cashing out on its own schedule.
function useBetSlot({ slot, serverBet, placeBet, cashOut, onInsufficientFunds, playSfx }) {
  const [busy, setBusy] = useState(false);
  const bet = serverBet?.status === 'placed'
    ? { stake: Number(serverBet.amount), status: 'placed', autoAt: serverBet.autoCashoutTarget }
    : null;

  const place = async (stake, autoAt) => {
    if (busy || bet) return;
    setBusy(true);
    try {
      const result = await placeBet(stake, autoAt, slot);
      if (result?.error?.toLowerCase().includes('insufficient balance')) onInsufficientFunds?.();
    } finally {
      setBusy(false);
    }
  };

  const cashOutBet = async () => {
    if (busy || !bet) return;
    setBusy(true);
    try {
      const result = await cashOut(slot);
      if (!result?.error) playSfx?.('cashout');
    } finally {
      setBusy(false);
    }
  };

  return { bet, busy, placeBet: place, cashOut: cashOutBet };
}

export default function CrashDemoPage() {
  const { state: gameState, placeBet, cashOut } = useGameSocket();
  const enginePhase = gameState?.phase;
  const round = {
    phase: enginePhase === 'RUNNING' ? 'flying' : enginePhase === 'CRASHED' ? 'crashed' : 'betting',
    multiplier: Number(gameState?.multiplier) || 1,
    // Presentation only: the server remains the source of the multiplier and result.
    elapsed: Math.max(0, Math.log(Math.max(1, Number(gameState?.multiplier) || 1)) / 0.085),
    countdown: gameState?.waitingEndsAt
      ? Math.min(1, Math.max(0, 1 - (gameState.waitingEndsAt - (gameState.now || Date.now())) / 6000))
      : 0,
    growthRate: 0.085,
    crashPoint: gameState?.crashPoint ? gameState.crashPoint / 100 : null,
  };
  // Starts from the signed-in account's real balance (same source AppShellHeader
  // itself would fetch) rather than a hardcoded demo number, so a fresh account
  // sees its actual Rs0.00 here too instead of a fake Rs5,000.
  const balance = typeof gameState?.balance === 'number' ? gameState.balance : null;
  const [showDepositPrompt, setShowDepositPrompt] = useState(false);
  const [showSupportPrompt, setShowSupportPrompt] = useState(false);
  const { playSfx } = useSound();
  const slot1 = useBetSlot({ slot: 1, serverBet: gameState?.myBets?.[1], placeBet, cashOut, onInsufficientFunds: () => setShowDepositPrompt(true), playSfx });
  const slot2 = useBetSlot({ slot: 2, serverBet: gameState?.myBets?.[2], placeBet, cashOut, onInsufficientFunds: () => setShowDepositPrompt(true), playSfx });
  const [history, setHistory] = useState([]);
  const [feed, setFeed] = useState([]);           // filled client-side only — random, so SSR can't match it
  const [betsTab, setBetsTab] = useState('all');
  const [showPrev, setShowPrev] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE);
  const [animationsOn, setAnimationsOn] = useState(true);
  const prevPhase = useRef(round.phase);
  const historyStripRef = useRef(null);

  // Keeps the simulated "All Bets" feed (and so TOTAL BETS) feeling alive
  // between rounds too, not just on crash — it drifts up and down on a
  // random cadence (some players joining, others' rows aging out), softly
  // pulled back toward FEED_SIZE so it never wanders too far off.
  useEffect(() => {
    let timer;
    const tick = () => {
      fetch('/api/game/all-bets', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setFeed((data.items || []).map((bet) => ({
          id: String(bet.id),
          user: bet.uid || 'Player',
          stake: Number(bet.amount),
          at: Number(bet.cashoutMultiplier || bet.crashPoint / 100 || 1),
          running: false,
          payout: Number(bet.payout || 0),
        }))))
        .catch(() => {});
      timer = setTimeout(tick, 10000);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkDeposit = new URLSearchParams(window.location.search).get('deposit') === 'check';
    fetch('/api/wallet', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        if (typeof data.balance !== 'number' || !Number.isFinite(data.balance)) return;
        if (checkDeposit) {
          setShowSupportPrompt(data.balance === 0);
          const url = new URL(window.location.href);
          url.searchParams.delete('deposit');
          window.history.replaceState(null, '', url.toString());
        }
      })
      .catch(() => { /* A failed request does not establish a zero balance. */ });
    return () => { cancelled = true; };
  }, []);

  // Seed the round-history strip from the DB on load so it isn't empty on a
  // fresh page load — new rounds still prepend live via the phase effect below.
  useEffect(() => {
    fetch('/api/game/history')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const items = data.items || [];
        setHistory(items.length ? items.slice(0, 10).map((r) => r.crashPoint / 100) : makeDummyHistory());
      })
      .catch(() => setHistory(makeDummyHistory()));
  }, []);

  // round-crash bookkeeping shared across both boxes: history strip + the
  // simulated public feed refresh (each box settles its own rows above)
  useEffect(() => {
    if (prevPhase.current === round.phase) return;
    prevPhase.current = round.phase;
    if (round.phase === 'flying') {
      playSfx('start');
    }
    if (round.phase === 'crashed') {
      playSfx('crash');
      setHistory((h) => [round.crashPoint, ...h].slice(0, 25));
      setVisibleCount(FEED_PAGE);
      // The strip prepends the new pill and keeps whatever scroll position
      // the user left it at, so if they'd scrolled right to see older
      // rounds, the new one landed off-screen to the left instead of
      // showing up. Snapping back to the start keeps the latest result
      // visible the moment it lands, same as the big multiplier readout.
      requestAnimationFrame(() => { historyStripRef.current?.scrollTo({ left: 0, behavior: 'smooth' }); });
    }
  }, [round.phase]);                            // eslint-disable-line react-hooks/exhaustive-deps

  // Bets still in flight (not yet cashed out or crashed) — shown live, same
  // as the simulated feed's "Running" rows, so the current user's own action
  // shows up immediately rather than only after it settles.
  const myLiveRows = [slot1, slot2]
    .filter((s) => s.bet?.status === 'placed')
    .map((s, i) => ({
      id: `me-live-${i}`,
      user: 'You',
      stake: s.bet.stake,
      at: round.phase === 'flying' ? round.multiplier : 1,
      running: true,
      payout: 0,
    }));

  const myAllRows = myLiveRows;
  // Current user's bets always lead the All Bets list, the simulated feed fills in below.
  const allBetsDisplay = [...myAllRows, ...feed.slice(0, Math.max(0, visibleCount - myAllRows.length))];
  const totalBetsCount = feed.length + myAllRows.length;

  return (
    <main className="crash-page" style={{ maxWidth: 900, width: '100%', margin: '0 auto', color: '#fff' }}>
     
      <AppShellHeader
        subtitle="Crash"
        balance={balance}
        showTrustBadges={false}
        crashProfileMenu
        animationsOn={animationsOn}
        onToggleAnimations={() => setAnimationsOn((v) => !v)}
      />

      <div className="crash-body">
      <div className="crash-history-wrap">
        <div className="crash-history" ref={historyStripRef}>
          {history.slice(0, 8).map((m, i) => (
            <span key={i} className="crash-history-pill" style={badgeStyle(m)}>
              {m.toFixed(2)}x
            </span>
          ))}
        </div>
        <button
          type="button"
          className={`crash-history-toggle${historyOpen ? ' open' : ''}`}
          onClick={() => setHistoryOpen((v) => !v)}
          aria-label="More round history"
        >
          <IconHistory />
        </button>

        {historyOpen && (
          <div className="crash-history-dropdown">
            {history.length === 0 && <span className="crash-history-empty">No rounds yet</span>}
            {history.map((m, i) => (
              <span key={i} className="crash-history-pill" style={badgeStyle(m)}>
                {m.toFixed(2)}x
              </span>
            ))}
          </div>
        )}
      </div>

      <CrashStage
        phase={round.phase}
        multiplier={round.multiplier}
        elapsed={round.elapsed}
        countdown={round.countdown}
        growthRate={round.growthRate}
        crashPoint={round.crashPoint}
        animationsOn={animationsOn}
      />

      <div className="crash-bet-row">
        <BetPanel
          phase={round.phase}
          multiplier={round.multiplier}
          bet={slot1.bet}
          busy={slot1.busy}
          onBet={slot1.placeBet}
          onCashOut={() => slot1.cashOut()}
        />
        <BetPanel
          phase={round.phase}
          multiplier={round.multiplier}
          bet={slot2.bet}
          busy={slot2.busy}
          onBet={slot2.placeBet}
          onCashOut={() => slot2.cashOut()}
        />
      </div>

      <div className="crash-bets-tabs">
        <button type="button" className={betsTab === 'all' ? 'active' : ''} onClick={() => setBetsTab('all')}>All Bets</button>
        <button type="button" className={betsTab === 'my' ? 'active' : ''} onClick={() => setBetsTab('my')}>My Bets</button>
      </div>

      <div className="crash-bets-meta">
        <span>TOTAL BETS : <b>{totalBetsCount}</b></span>
        <button type="button" className="crash-prev-hand" onClick={() => setShowPrev((v) => !v)}>
          {showPrev && history[0] != null ? `${history[0].toFixed(2)}x` : 'Previous hand'}
        </button>
      </div>

      <div className="crash-bets-table">
        <div className="crash-bets-head">
          <span>User</span><span>Bet</span><span>Mult.</span><span>Cash out</span>
        </div>
        {(betsTab === 'all' ? allBetsDisplay : myAllRows).map((r) => {
          // A simulated row only reads "Running" while a round is actually
          // flying — otherwise every bet has already settled one way or another.
          const isLive = r.running && round.phase === 'flying';
          return (
            <div key={r.id} className={`crash-bets-row${!isLive && r.payout ? ' won' : ''}${r.user === 'You' ? ' mine' : ''}`}>
              <span className="crash-bets-user">{r.user}</span>
              <span className="crash-pill crash-pill-stake">{r.stake.toFixed(2)}</span>
              <span className="crash-pill crash-pill-mult" style={badgeStyle(r.at)}>{r.at.toFixed(2)}x</span>
              <span className={`crash-cashout${!isLive && r.payout ? ' won' : ''}`}>
                {isLive ? 'Running' : r.payout ? r.payout.toFixed(2) : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {betsTab === 'all' && visibleCount - myAllRows.length < feed.length && (
        <button type="button" className="crash-show-more" onClick={() => setVisibleCount((v) => v + FEED_PAGE)}>
          Show more
        </button>
      )}
      </div>

      {showSupportPrompt && (
        <div className={depositStyles.overlay}>
          <div className={`${depositStyles.card} ${depositStyles.dark}`} role="dialog" aria-modal="true" aria-labelledby="deposit-support-title" aria-describedby="deposit-support-description">
            <div className={depositStyles.supportIcon}><IconHeadset /></div>
            <span className={depositStyles.eyebrow}>DEPOSIT UPDATE</span>
            <h2 id="deposit-support-title">Need a hand?</h2>
            <p id="deposit-support-description">Your deposit hasn’t reached your wallet yet. Our support team can help you check it.</p>
            <div className={depositStyles.balance}><span>Current wallet balance</span><strong>Rs 0.00</strong><small>Deposit not reflected yet</small></div>
            <p className={depositStyles.receipt}>Keep your payment receipt ready so support can review your request.</p>
            <Link href="/support" className={depositStyles.supportButton} autoFocus><IconHeadset />Contact Support<IconChevronRight /></Link>
            <button type="button" className={depositStyles.later} onClick={() => setShowSupportPrompt(false)}>Back to Crash</button>
          </div>
        </div>
      )}

      {showDepositPrompt && !showSupportPrompt && (
        <div className="crash-modal-overlay" onClick={() => setShowDepositPrompt(false)}>
          <div className="crash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Insufficient balance</h3>
            <p>Your balance is too low for this bet. Deposit funds to keep playing.</p>
            <div className="crash-modal-actions">
              <button type="button" className="crash-modal-cancel" onClick={() => setShowDepositPrompt(false)}>
                Cancel
              </button>
              <Link href="/deposit#deposit-options" className="crash-modal-deposit">
                Deposit now
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
