'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AppShellHeader from '../components/AppShellHeader';
import BetSheet from './BetSheet';
import { useWingoRound } from './useWingoRound';
import {
  MODES,
  MULTIPLIERS,
  colorsOf,
  modeByKey,
  money,
  payoutFor,
  recentResults,
  resultFor,
  selectionLabel,
  sizeOf,
} from './wingoLogic';
import './wingo.css';

/*
 * Win Go — ported from the standalone 51game-wingo HTML/JS project.
 *
 * Practice mode only: the balance and bets live in this browser
 * (localStorage), exactly like the original's on-page demo wallet. Nothing
 * here touches the real account wallet behind /api/wallet. To make it real,
 * replace placeBet / the settlement effect with calls to server routes —
 * those are the only two places that move money.
 */

const START_BALANCE = 10_000;
const STORE_KEY = 'wingo-practice-v1';
const PAGE_SIZE = 10;
const HISTORY_PAGES = 10;

const RULES = [
  ['green', 'If the result shows 1, 3, 7, 9 you will get (98×2) 196; if the result shows 5, you will get (98×1.5) 147.'],
  ['red', 'If the result shows 2, 4, 6, 8 you will get (98×2) 196; if the result shows 0, you will get (98×1.5) 147.'],
  ['violet', 'If the result shows 0 or 5, you will get (98×4.5) 441.'],
  ['number', 'If the result is the same as the number you selected, you will get (98×9) 882.'],
  ['big', 'If the result shows 5, 6, 7, 8, 9 you will get (98×2) 196.'],
  ['small', 'If the result shows 0, 1, 2, 3, 4 you will get (98×2) 196.'],
];

function ColorDots({ n }) {
  return (
    <span className="wingo-dots">
      {colorsOf(n).map((c) => <i key={c} className={`wingo-dot ${c}`} />)}
    </span>
  );
}

const numClass = (n) => (n === 0 ? 'mix-red' : n === 5 ? 'mix-green' : colorsOf(n)[0]);

export default function WingoPage() {
  const [modeKey, setModeKey] = useState(MODES[0].key);
  const mode = modeByKey(modeKey);
  const [voiceOn, setVoiceOn] = useState(true);
  const { now, period, secondsLeft, locked } = useWingoRound(mode, { voiceOn });

  const [balance, setBalance] = useState(START_BALANCE);
  const [bets, setBets] = useState([]);
  const loadedRef = useRef(false);

  const [presetQty, setPresetQty] = useState(1);
  const [sheet, setSheet] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [resultDialog, setResultDialog] = useState(null);
  const [autoClose, setAutoClose] = useState(false);
  const [tab, setTab] = useState('game');
  const [page, setPage] = useState(0);

  // ---- practice wallet persistence ----
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (saved && typeof saved.balance === 'number') setBalance(saved.balance);
      if (saved && Array.isArray(saved.bets)) setBets(saved.bets);
    } catch { /* fresh practice wallet */ }
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ balance, bets: bets.slice(0, 100) }));
    } catch { /* storage unavailable — keep playing in memory */ }
  }, [balance, bets]);

  // ---- toast ----
  const toastTimer = useRef(null);
  const showToast = (text, kind = 'ok') => {
    clearTimeout(toastTimer.current);
    setToast({ text, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  // ---- close the bet sheet once betting locks, like the original ----
  useEffect(() => {
    if (locked) setSheet(null);
  }, [locked]);

  // ---- settlement: any pending bet whose period has ended ----
  useEffect(() => {
    if (now === null) return;
    const due = bets.filter((b) => b.status === 'pending' && b.endsAt <= now);
    if (due.length === 0) return;

    let credit = 0;
    const settled = new Map();
    for (const b of due) {
      const number = resultFor(b.modeKey, b.issue);
      const payout = payoutFor(b.selection, b.amount, number);
      credit += payout;
      settled.set(b.id, { ...b, status: payout > 0 ? 'won' : 'lost', number, payout });
    }
    setBets((prev) => prev.map((b) => settled.get(b.id) || b));
    if (credit > 0) setBalance((v) => Math.round((v + credit) * 100) / 100);

    // One result dialog for the most recent finished period the player was in.
    const last = due.reduce((a, b) => (b.endsAt > a.endsAt ? b : a));
    const group = [...settled.values()].filter((b) => b.modeKey === last.modeKey && b.issue === last.issue);
    const bonus = group.reduce((s, b) => s + b.payout, 0);
    setResultDialog({
      issue: last.issue,
      modeLabel: modeByKey(last.modeKey).label,
      number: group[0].number,
      won: bonus > 0,
      bonus,
    });
  }, [now, bets]);

  useEffect(() => {
    if (!resultDialog || !autoClose) return;
    const t = setTimeout(() => setResultDialog(null), 3000);
    return () => clearTimeout(t);
  }, [resultDialog, autoClose]);

  // ---- betting ----
  const openSheet = (selection, quantity = presetQty) => {
    if (!period || locked) return;
    setSheet({ selection, quantity });
  };

  const placeBet = ({ selection, amount }) => {
    if (!period || locked) return;
    if (amount > balance) {
      showToast('Insufficient balance', 'fail');
      return;
    }
    setBalance((v) => Math.round((v - amount) * 100) / 100);
    setBets((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        modeKey,
        issue: period.issue,
        endsAt: period.endsAt,
        selection,
        amount,
        status: 'pending',
        placedAt: Date.now(),
      },
      ...prev,
    ]);
    setSheet(null);
    showToast('Bet succeed');
  };

  const randomPick = () => {
    if (!period || locked) return;
    openSheet({ kind: 'number', value: Math.floor(Math.random() * 10) });
  };

  // ---- derived views ----
  // Recompute history only when the period rolls over, not every tick.
  const periodIssue = period?.issue;
  const lastFive = useMemo(
    () => (now === null ? [] : recentResults(mode, now, 5)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modeKey, periodIssue],
  );
  const gameHistory = useMemo(
    () => (now === null ? [] : recentResults(mode, now, PAGE_SIZE, page * PAGE_SIZE)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modeKey, periodIssue, page],
  );
  const myBets = bets.filter((b) => b.modeKey === modeKey);
  const myPages = Math.max(1, Math.ceil(myBets.length / PAGE_SIZE));
  const totalPages = tab === 'game' ? HISTORY_PAGES : myPages;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const switchMode = (key) => {
    setModeKey(key);
    setPage(0);
    setSheet(null);
  };

  return (
    <main className="wingo-page">
      <AppShellHeader subtitle="Win Go" showTrustBadges={false} />

      <div className="wingo-body">
        {/* practice wallet */}
        <section className="wingo-card wingo-wallet">
          <div>
            <div className="wingo-wallet-lbl">Practice balance</div>
            <div className="wingo-wallet-val">Rs {money(balance)}</div>
          </div>
          <div className="wingo-wallet-actions">
            <button
              type="button"
              className={`wingo-icon-btn${voiceOn ? '' : ' off'}`}
              onClick={() => setVoiceOn((v) => !v)}
              aria-label={voiceOn ? 'Mute countdown' : 'Unmute countdown'}
            >
              {voiceOn ? '🔊' : '🔇'}
            </button>
            <button
              type="button"
              className="wingo-ghost-btn"
              onClick={() => {
                setBalance(START_BALANCE);
                setBets([]);
                showToast('Practice wallet reset');
              }}
            >
              Reset
            </button>
          </div>
        </section>

        {/* mode tabs */}
        <nav className="wingo-modes">
          {MODES.map((m) => (
            <button
              type="button"
              key={m.key}
              className={`wingo-mode${m.key === modeKey ? ' active' : ''}`}
              onClick={() => switchMode(m.key)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              <span>Win Go</span>
              <b>{m.label.replace('Win Go ', '')}</b>
            </button>
          ))}
        </nav>

        {/* timer */}
        <section className="wingo-card wingo-time">
          <div className="wingo-time-l">
            <button type="button" className="wingo-howto" onClick={() => setShowRules(true)}>How to play</button>
            <div className="wingo-time-name">{mode.label}</div>
            <div className="wingo-balls">
              {lastFive.map((r) => (
                <img key={r.issue} src={`/wingo/n${r.number}.png`} alt={String(r.number)} />
              ))}
            </div>
          </div>
          <div className="wingo-time-r">
            <div className="wingo-time-lbl">Time remaining</div>
            <div className="wingo-digits">
              {period ? (
                <>
                  <span>{mm[0]}</span><span>{mm[1]}</span><span className="sep">:</span><span>{ss[0]}</span><span>{ss[1]}</span>
                </>
              ) : (
                <><span>-</span><span>-</span><span className="sep">:</span><span>-</span><span>-</span></>
              )}
            </div>
            <div className="wingo-issue">{period?.issue ?? '—'}</div>
          </div>
        </section>

        {/* betting */}
        <section className="wingo-card wingo-betting">
          <div className="wingo-color-row">
            <button type="button" className="wingo-color green" onClick={() => openSheet({ kind: 'color', value: 'green' })}>Green</button>
            <button type="button" className="wingo-color violet" onClick={() => openSheet({ kind: 'color', value: 'violet' })}>Violet</button>
            <button type="button" className="wingo-color red" onClick={() => openSheet({ kind: 'color', value: 'red' })}>Red</button>
          </div>

          <div className="wingo-num-grid">
            {Array.from({ length: 10 }, (_, n) => (
              <button type="button" key={n} className="wingo-num" onClick={() => openSheet({ kind: 'number', value: n })}>
                <img src={`/wingo/n${n}.png`} alt={String(n)} />
              </button>
            ))}
          </div>

          <div className="wingo-mult">
            <button type="button" className="wingo-random" onClick={randomPick}>Random</button>
            {MULTIPLIERS.map((m) => (
              <button type="button" key={m} className={`wingo-mult-btn${presetQty === m ? ' active' : ''}`} onClick={() => setPresetQty(m)}>
                X{m}
              </button>
            ))}
          </div>

          <div className="wingo-size-row">
            <button type="button" className="wingo-size big" onClick={() => openSheet({ kind: 'size', value: 'big' })}>Big</button>
            <button type="button" className="wingo-size small" onClick={() => openSheet({ kind: 'size', value: 'small' })}>Small</button>
          </div>

          {locked && (
            <div className="wingo-lock" aria-live="polite">
              <span>{ss[0]}</span>
              <span>{ss[1]}</span>
            </div>
          )}
        </section>

        {/* history */}
        <section className="wingo-history">
          <div className="wingo-history-tabs">
            <button type="button" className={tab === 'game' ? 'active' : ''} onClick={() => { setTab('game'); setPage(0); }}>Game history</button>
            <button type="button" className={tab === 'mine' ? 'active' : ''} onClick={() => { setTab('mine'); setPage(0); }}>My history</button>
          </div>

          {tab === 'game' ? (
            <div className="wingo-card wingo-table">
              <div className="wingo-tr head">
                <span>Period</span><span>Number</span><span>Big Small</span><span>Color</span>
              </div>
              {gameHistory.map((r) => (
                <div className="wingo-tr" key={r.issue}>
                  <span className="wingo-td-issue">{r.issue}</span>
                  <span className={`wingo-td-num ${numClass(r.number)}`}>{r.number}</span>
                  <span>{sizeOf(r.number)}</span>
                  <span><ColorDots n={r.number} /></span>
                </div>
              ))}
            </div>
          ) : (
            <div className="wingo-card wingo-mine">
              {myBets.length === 0 && <div className="wingo-empty">No bets yet in {mode.label}</div>}
              {myBets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((b) => {
                const tone = b.selection.kind === 'number' ? numClass(b.selection.value) : b.selection.value;
                return (
                  <div className="wingo-bet-row" key={b.id}>
                    <span className={`wingo-bet-pick ${tone}`}>{selectionLabel(b.selection)}</span>
                    <div className="wingo-bet-mid">
                      <b>{b.issue}</b>
                      <span>{new Date(b.placedAt).toLocaleString()}</span>
                    </div>
                    <div className="wingo-bet-r">
                      <span className={`wingo-status ${b.status}`}>
                        {b.status === 'pending' ? 'Pending' : b.status === 'won' ? 'Succeed' : 'Failed'}
                      </span>
                      <b className={b.status}>
                        {b.status === 'won' ? `+Rs ${money(b.payout)}` : b.status === 'lost' ? `-Rs ${money(b.amount)}` : `Rs ${money(b.amount)}`}
                      </b>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="wingo-pager">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">‹</button>
            <span>{page + 1}/{totalPages}</span>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page">›</button>
          </div>
        </section>
      </div>

      {sheet && (
        <BetSheet
          key={`${sheet.selection.kind}-${sheet.selection.value}`}
          mode={mode}
          selection={sheet.selection}
          initialQuantity={sheet.quantity}
          onCancel={() => setSheet(null)}
          onConfirm={placeBet}
          onShowRules={() => setShowRules(true)}
        />
      )}

      {showRules && (
        <div className="wingo-overlay center" onClick={() => setShowRules(false)}>
          <div className="wingo-dialog wingo-rules" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="How to play">
            <div className="wingo-dialog-head">How to play</div>
            <div className="wingo-rules-body">
              <p>{mode.label}: one issue every {mode.ms / 1000 >= 60 ? `${mode.ms / 60000} minute${mode.ms > 60000 ? 's' : ''}` : `${mode.ms / 1000} seconds`}. Betting closes for the last 5 seconds while the draw is made. It runs all day.</p>
              <p>If you spend 100 to trade, after deducting the 2% service fee your contract amount is 98:</p>
              <ol>
                {RULES.map(([k, text]) => (
                  <li key={k}><b className={`wingo-rule-k ${k}`}>Select {k}</b>: {text}</li>
                ))}
              </ol>
            </div>
            <button type="button" className="wingo-dialog-btn" onClick={() => setShowRules(false)}>I know</button>
          </div>
        </div>
      )}

      {resultDialog && (
        <div className="wingo-overlay center" onClick={() => setResultDialog(null)}>
          <div className={`wingo-dialog wingo-result ${resultDialog.won ? 'won' : 'lost'}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Round result">
            <div className="wingo-result-title">{resultDialog.won ? 'Congratulations' : 'Sorry'}</div>
            <div className="wingo-result-line">
              <span>Lottery results</span>
              <span className={`wingo-result-tag ${numClass(resultDialog.number)}`}>
                {colorsOf(resultDialog.number).map((c) => c[0].toUpperCase() + c.slice(1)).join(' ')}
              </span>
              <span className={`wingo-result-ball ${numClass(resultDialog.number)}`}>{resultDialog.number}</span>
              <span className="wingo-result-tag size">{sizeOf(resultDialog.number)}</span>
            </div>
            <div className="wingo-result-bonus">
              {resultDialog.won ? (
                <>
                  <span>Bonus</span>
                  <b>Rs {money(resultDialog.bonus)}</b>
                </>
              ) : (
                <b>Lose</b>
              )}
              <small>Period: {resultDialog.modeLabel} {resultDialog.issue}</small>
            </div>
            <label className="wingo-auto">
              <input type="checkbox" checked={autoClose} onChange={(e) => setAutoClose(e.target.checked)} />
              <span>3 seconds auto close</span>
            </label>
            <button type="button" className="wingo-result-close" onClick={() => setResultDialog(null)} aria-label="Close">×</button>
          </div>
        </div>
      )}

      {toast && <div className={`wingo-toast ${toast.kind}`}>{toast.text}</div>}
    </main>
  );
}
