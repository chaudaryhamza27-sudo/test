'use client';

import { useEffect, useRef, useState } from 'react';
import CrashStage from './CrashStage';
import BetPanel from './BetPanel';
import useCrashRound from './useCrashRound';
import AppShellHeader from '../components/AppShellHeader';
import './crash.css';

/*
 * UI harness for the crash stage. It runs the local demo engine so the page
 * works with nothing else running.
 *
 * To point it at the real engine:
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
    payout: running ? 0 : Math.round(stake * at * 100) / 100,
  };
};

const FEED_SIZE = 200;
const FEED_PAGE = 15;
const makeFeed = (n = FEED_SIZE) => Array.from({ length: n }, makeFeedRow);

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
function useBetSlot(round, balance, setBalance) {
  const [bet, setBet] = useState(null);          // { stake, status, autoAt }
  const [rows, setRows] = useState([]);
  const prevPhase = useRef(round.phase);

  const placeBet = (stake, autoAt) => {
    if (stake > balance) return;
    setBalance((b) => b - stake);
    setBet({ stake, autoAt, status: round.phase === 'betting' ? 'placed' : 'queued' });
  };

  const cancelBet = () => {
    if (!bet) return;
    setBalance((b) => b + bet.stake);            // refund, queued or not
    setBet(null);
  };

  const cashOut = (at = round.multiplier) => {
    if (!bet || bet.status !== 'placed') return;
    const payout = bet.stake * at;
    setBalance((b) => b + payout);
    setRows((r) => [{ id: Date.now() + Math.random(), stake: bet.stake, at, payout }, ...r].slice(0, 12));
    setBet({ ...bet, status: 'cashed' });
  };

  // auto cash-out
  useEffect(() => {
    if (round.phase !== 'flying') return;
    if (bet?.status === 'placed' && bet.autoAt && round.multiplier >= bet.autoAt) cashOut(bet.autoAt);
  }, [round.multiplier, round.phase]);          // eslint-disable-line react-hooks/exhaustive-deps

  // round transitions: settle losses, promote queued bets
  useEffect(() => {
    if (prevPhase.current === round.phase) return;
    const was = prevPhase.current;
    prevPhase.current = round.phase;

    if (round.phase === 'crashed' && bet?.status === 'placed') {
      setRows((r) => [{ id: Date.now() + Math.random(), stake: bet.stake, at: round.crashPoint, payout: 0 }, ...r].slice(0, 12));
    }

    if (round.phase === 'betting' && was !== 'betting') {
      setBet((b) => (b && b.status === 'queued' ? { ...b, status: 'placed' } : null));
    }
  }, [round.phase]);                            // eslint-disable-line react-hooks/exhaustive-deps

  return { bet, rows, placeBet, cancelBet, cashOut };
}

export default function CrashDemoPage() {
  const round = useCrashRound({ source: 'demo' });
  const [balance, setBalance] = useState(5000);
  const slot1 = useBetSlot(round, balance, setBalance);
  const slot2 = useBetSlot(round, balance, setBalance);
  const [history, setHistory] = useState([]);
  const [feed, setFeed] = useState([]);           // filled client-side only — random, so SSR can't match it
  const [betsTab, setBetsTab] = useState('all');
  const [showPrev, setShowPrev] = useState(false);
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE);
  const prevPhase = useRef(round.phase);

  useEffect(() => { setFeed(makeFeed()); }, []);

  // round-crash bookkeeping shared across both boxes: history strip + the
  // simulated public feed refresh (each box settles its own rows above)
  useEffect(() => {
    if (prevPhase.current === round.phase) return;
    prevPhase.current = round.phase;
    if (round.phase === 'crashed') {
      setHistory((h) => [round.crashPoint, ...h].slice(0, 25));
      setFeed(makeFeed());
      setVisibleCount(FEED_PAGE);
    }
  }, [round.phase]);                            // eslint-disable-line react-hooks/exhaustive-deps

  const myRows = [...slot1.rows, ...slot2.rows].sort((a, b) => b.id - a.id).slice(0, 12);

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

  const myAllRows = [...myLiveRows, ...myRows.map((r) => ({ ...r, user: 'You' }))];
  // Current user's bets always lead the All Bets list, the simulated feed fills in below.
  const allBetsDisplay = [...myAllRows, ...feed.slice(0, Math.max(0, visibleCount - myAllRows.length))];
  const totalBetsCount = feed.length + myAllRows.length;

  return (
    <main className="crash-page" style={{ maxWidth: 900, width: '100%', margin: '0 auto', color: '#fff' }}>
      <AppShellHeader subtitle="Crash" balance={balance} showTrustBadges={false} />

      <div className="crash-history">
        {history.map((m, i) => (
          <span key={i} className="crash-history-pill" style={badgeStyle(m)}>
            {m.toFixed(2)}x
          </span>
        ))}
      </div>

      <CrashStage
        phase={round.phase}
        multiplier={round.multiplier}
        elapsed={round.elapsed}
        countdown={round.countdown}
      />

      <div className="crash-bet-row">
        <BetPanel
          phase={round.phase}
          multiplier={round.multiplier}
          bet={slot1.bet}
          onBet={slot1.placeBet}
          onCancel={slot1.cancelBet}
          onCashOut={() => slot1.cashOut()}
        />
        <BetPanel
          phase={round.phase}
          multiplier={round.multiplier}
          bet={slot2.bet}
          onBet={slot2.placeBet}
          onCancel={slot2.cancelBet}
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
        {(betsTab === 'all' ? allBetsDisplay : myAllRows).map((r) => (
          <div key={r.id} className={`crash-bets-row${r.payout ? ' won' : ''}${r.user === 'You' ? ' mine' : ''}`}>
            <span className="crash-bets-user">{r.user}</span>
            <span className="crash-pill crash-pill-stake">{r.stake.toFixed(2)}</span>
            <span className="crash-pill crash-pill-mult" style={badgeStyle(r.at)}>{r.at.toFixed(2)}x</span>
            <span className={`crash-cashout${r.payout ? ' won' : ''}`}>
              {r.running ? 'Running' : r.payout ? r.payout.toFixed(2) : '—'}
            </span>
          </div>
        ))}
      </div>

      {betsTab === 'all' && visibleCount - myAllRows.length < feed.length && (
        <button type="button" className="crash-show-more" onClick={() => setVisibleCount((v) => v + FEED_PAGE)}>
          Show more
        </button>
      )}
    </main>
  );
}
