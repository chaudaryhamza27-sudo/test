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

// "All Bets" mixes real settled bets (from /api/game/all-bets) with a batch
// of simulated players who "join" each round the moment it starts flying.
// Each simulated player's cash-out target is picked when they join and is
// only ever revealed against the round's own live multiplier as it climbs —
// never a number ahead of where the round actually is — so a running row's
// point can't outrun the real climbing multiplier shown on the stage.
// Same shape as a real account's uid (see src/app/api/auth/signup/route.js) —
// a plain 6-digit number, not a letter-prefixed handle — so a simulated row
// can't be told apart from a real one just by how the "User" column looks.
const randUser = () => String(Math.floor(100000 + Math.random() * 900000));

// A fixed pool (not regenerated every round) so the same simulated handles
// recur across rounds instead of a brand-new name every time.
const DUMMY_USER_POOL = Array.from({ length: 1200 }, randUser);

const DUMMY_SEEDS_MIN = 300;
const DUMMY_SEEDS_MAX = 320;

// Picks the players "in" a fresh round and, for each, the cash-out target
// they'll try to hit — decided once, up front, same as a real player choosing
// an auto-cashout before the plane takes off. Whether that target is ever
// actually reached depends on the real round outcome, resolved at render time.
const makeDummySeeds = () => {
  const count = DUMMY_SEEDS_MIN + Math.floor(Math.random() * (DUMMY_SEEDS_MAX - DUMMY_SEEDS_MIN + 1));
  return Array.from({ length: count }, () => {
    const willCashOut = Math.random() < 0.55;
    return {
      id: `dummy-${Math.random().toString(36).slice(2)}`,
      user: DUMMY_USER_POOL[Math.floor(Math.random() * DUMMY_USER_POOL.length)],
      stake: Math.round((Math.random() * 4000 + 20) * 100) / 100,
      // null = rides it out to the crash, same as a real lost bet. Otherwise,
      // a cube-skewed pick so plenty of players cash out within the first
      // instant of flight (near 1.0x-1.5x), same as real low-target players,
      // with a shrinking few holding out for a bigger multiplier.
      targetAt: willCashOut ? Math.round((1.02 + Math.random() ** 3 * 9) * 100) / 100 : null,
    };
  });
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
  // This round's simulated players (id/user/stake/target only — never a
  // resolved outcome) and the crash point their round settled at, once it
  // has. Refs, not state: they're read fresh every render alongside the live
  // round.multiplier/round.phase rather than driving their own re-renders.
  const dummySeedsRef = useRef([]);
  const lastCrashPointRef = useRef(null);

  // Keeps the "All Bets" feed (and so TOTAL BETS) topped up with real settled
  // bets — the simulated players are layered in separately below, tied to
  // each round's own lifecycle rather than this timer.
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
  // simulated players' lifecycle (each box settles its own live rows above)
  useEffect(() => {
    if (prevPhase.current === round.phase) return;
    prevPhase.current = round.phase;
    if (round.phase === 'flying') {
      playSfx('start');
      // A fresh batch "joins" the instant this round starts flying — this is
      // the only place new simulated players are picked, so the same batch
      // stays put (and keeps resolving against this same round) for its
      // whole flight instead of getting reshuffled mid-air.
      dummySeedsRef.current = makeDummySeeds();
    }
    if (round.phase === 'crashed') {
      playSfx('crash');
      // Freezes what this round's players resolve against even after the
      // *next* round's betting phase clears round.crashPoint back to null.
      lastCrashPointRef.current = round.crashPoint;
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

  // This round's simulated players, resolved against the real round state —
  // never a stored outcome, so a "Running" row's point always reads back as
  // whatever the live multiplier actually is right now, and a settled one
  // freezes at either its own target or the round's real crash point.
  const dummyRows = dummySeedsRef.current.map((seed) => {
    if (round.phase === 'flying') {
      const cashedOut = seed.targetAt != null && round.multiplier >= seed.targetAt;
      return {
        id: seed.id,
        user: seed.user,
        stake: seed.stake,
        at: cashedOut ? seed.targetAt : round.multiplier,
        running: !cashedOut,
        payout: cashedOut ? Math.round(seed.stake * seed.targetAt * 100) / 100 : 0,
      };
    }
    // Betting (next round queued) or crashed: this batch's round is already
    // over, so settle against the crash point it actually ended at.
    const crashPoint = lastCrashPointRef.current ?? 1;
    const won = seed.targetAt != null && seed.targetAt <= crashPoint;
    return {
      id: seed.id,
      user: seed.user,
      stake: seed.stake,
      at: won ? seed.targetAt : crashPoint,
      running: false,
      payout: won ? Math.round(seed.stake * seed.targetAt * 100) / 100 : 0,
    };
  });

  // Current user's bets lead the All Bets list, then this round's simulated
  // players, then the real settled-bets feed fills in the rest.
  const allBetsDisplay = [
    ...myAllRows,
    ...dummyRows,
    ...feed.slice(0, Math.max(0, visibleCount - myAllRows.length - dummyRows.length)),
  ];
  const totalBetsCount = feed.length + myAllRows.length + dummyRows.length;

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

      {betsTab === 'all' && visibleCount - myAllRows.length - dummyRows.length < feed.length && (
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
