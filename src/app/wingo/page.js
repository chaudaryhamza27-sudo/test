'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppShellHeader from '../components/AppShellHeader';
import BetSheet from './BetSheet';
import { useWingoRound } from './useWingoRound';
import { MODES, MULTIPLIERS, colorsOf, modeByKey, money, selectionLabel, sizeOf } from './wingoLogic';
import './wingo.css';

/*
 * Win Go — ported from the standalone 51game-wingo HTML/JS project.
 *
 * Plays against the signed-in account's real wallet balance. The server owns
 * everything that matters: POST /api/wingo/bet debits the balance for the
 * current period, and GET /api/wingo/state settles finished bets, credits
 * wins and returns the result history (results are drawn server-side with a
 * secret, see src/lib/wingo.js). This page only renders and calls those two.
 */

const PAGE_SIZE = 10;
const HISTORY_PAGES = 10;

const RULES = [
  ['green', 'If the result shows 1, 3, 7, 9 you will get (98×2) 196; if the result shows 5, you will get (98×1.5) 147.'],
  ['red', 'If the result shows 2, 4, 6, 8 you will get (98×2) 196; if the result shows 0, you will get (98×1.5) 147.'],
  ['violet', 'If the result shows 0 or 5, you will get (98×4.5) 441.'],
  ['number', 'If the result is the same as the number you selected, you will get (98×9) 882.'],
  ['big', 'If the result shows 6, 7, 8, 9 you will get (98×2) 196. If the result shows 0 or 5, Big loses.'],
  ['small', 'If the result shows 1, 2, 3, 4 you will get (98×2) 196. If the result shows 0 or 5, Small loses.'],
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
  const { period, secondsLeft, locked } = useWingoRound(mode, { voiceOn });

  // null until the first sync answers — never shown as a fake 0.
  const [signedIn, setSignedIn] = useState(null);
  const [balance, setBalance] = useState(null);
  const [results, setResults] = useState([]);
  const [lastFive, setLastFive] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const [placing, setPlacing] = useState(false);

  const [presetQty, setPresetQty] = useState(1);
  const [sheet, setSheet] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [resultDialog, setResultDialog] = useState(null);
  const [autoClose, setAutoClose] = useState(false);
  const [depositPrompt, setDepositPrompt] = useState(false);
  const [tab, setTab] = useState('game');
  const [page, setPage] = useState(0);

  // ---- server sync: settle finished bets, refresh balance + history ----
  const syncSeq = useRef(0);
  const retryTimer = useRef(null);
  const zeroPromptShown = useRef(false);
  const sync = useCallback(async () => {
    const seq = ++syncSeq.current;
    clearTimeout(retryTimer.current);
    let data;
    try {
      const res = await fetch(`/api/wingo/state?mode=${modeKey}&page=${tab === 'game' ? page : 0}`, { cache: 'no-store' });
      if (!res.ok) return;
      data = await res.json();
    } catch {
      return; // a failed sync changes nothing; the next period tick retries
    }
    if (seq !== syncSeq.current) return; // a newer sync (mode/page change) already answered

    setSignedIn(data.signedIn);
    setResults(data.results);
    setLastFive(data.lastFive);
    setMyBets(data.myBets);
    if (typeof data.balance === 'number') {
      setBalance(data.balance);
      // First deposit nudge: a signed-in player with nothing to bet with.
      if (data.balance <= 0 && !zeroPromptShown.current) {
        zeroPromptShown.current = true;
        setDepositPrompt(true);
      }
    }

    if (data.settled.length > 0) {
      const last = data.settled.reduce((a, b) => (b.endsAt > a.endsAt ? b : a));
      const group = data.settled.filter((b) => b.mode === last.mode && b.issue === last.issue);
      const bonus = group.reduce((s, b) => s + b.payout, 0);
      setResultDialog({
        issue: last.issue,
        modeLabel: modeByKey(last.mode).label,
        number: last.number,
        won: bonus > 0,
        bonus,
      });
    }

    // Client clock a little ahead of the server's: a bet can still read as
    // pending just after the boundary, so check again shortly.
    if (data.myBets.some((b) => b.status === 'pending' && b.endsAt <= Date.now())) {
      retryTimer.current = setTimeout(sync, 1500);
    }
  }, [modeKey, page, tab]);

  // On load, on mode/page/tab change, and every time a period rolls over.
  const periodIssue = period?.issue;
  useEffect(() => {
    if (!periodIssue) return;
    sync();
  }, [sync, periodIssue]);
  useEffect(() => () => clearTimeout(retryTimer.current), []);

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

  useEffect(() => {
    if (!resultDialog || !autoClose) return;
    const t = setTimeout(() => setResultDialog(null), 3000);
    return () => clearTimeout(t);
  }, [resultDialog, autoClose]);

  // ---- betting ----
  const openSheet = (selection, quantity = presetQty) => {
    if (!period || locked) return;
    if (signedIn === false) {
      showToast('Please log in to play', 'fail');
      return;
    }
    if (balance !== null && balance <= 0) {
      setDepositPrompt(true);
      return;
    }
    setSheet({ selection, quantity });
  };

  const placeBet = async ({ selection, amount }) => {
    if (!period || locked || placing) return;
    if (balance !== null && amount > balance) {
      setSheet(null);
      setDepositPrompt(true);
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch('/api/wingo/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: modeKey, issue: period.issue, selection, amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) setSignedIn(false);
        if (data.error?.toLowerCase().includes('insufficient balance')) {
          setSheet(null);
          setDepositPrompt(true);
        } else {
          showToast(data.error || 'Could not place the bet', 'fail');
        }
        return;
      }
      setBalance(data.balance);
      setMyBets((prev) => [data.bet, ...prev]);
      setSheet(null);
      showToast('Bet succeed');
    } catch {
      showToast('Network error, bet not placed', 'fail');
    } finally {
      setPlacing(false);
    }
  };

  const randomPick = () => {
    if (!period || locked) return;
    openSheet({ kind: 'number', value: Math.floor(Math.random() * 10) });
  };

  // ---- derived views ----
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
      <AppShellHeader subtitle="Win Go" showTrustBadges={false} balance={balance ?? undefined} />

      <div className="wingo-body">
        {/* account wallet */}
        <section className="wingo-card wingo-wallet">
          <div>
            <div className="wingo-wallet-lbl">Wallet balance</div>
            <div className="wingo-wallet-val">
              {signedIn === false ? 'Not logged in' : balance === null ? 'Rs —' : `Rs ${money(balance)}`}
            </div>
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
            {signedIn === false ? (
              <Link href="/login" className="wingo-ghost-btn">Log in</Link>
            ) : (
              <Link href="/deposit#deposit-options" className="wingo-ghost-btn">Deposit</Link>
            )}
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
            <button type="button" className="wingo-size big" onClick={() => openSheet({ kind: 'size', value: 'big' })}>Big <small>6-9</small></button>
            <button type="button" className="wingo-size small" onClick={() => openSheet({ kind: 'size', value: 'small' })}>Small <small>1-4</small></button>
          </div>
          <p className="wingo-size-note">0 and 5: Big and Small both lose</p>

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
              {results.map((r) => (
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
          busy={placing}
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

      {depositPrompt && (
        <div className="wingo-overlay center" onClick={() => setDepositPrompt(false)}>
          <div className="wingo-dialog wingo-deposit" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="wingo-deposit-title">
            <div className="wingo-deposit-icon">₨</div>
            <h3 id="wingo-deposit-title">{balance > 0 ? 'Insufficient balance' : 'Make your first deposit'}</h3>
            <p>Add funds to your wallet to start playing Win Go.</p>
            <div className="wingo-deposit-bal">
              <span>Current wallet balance</span>
              <strong>Rs {money(balance)}</strong>
            </div>
            <Link href="/deposit#deposit-options" className="wingo-dialog-btn wingo-deposit-go" autoFocus>Deposit now</Link>
            <button type="button" className="wingo-deposit-later" onClick={() => setDepositPrompt(false)}>Later</button>
          </div>
        </div>
      )}

      {toast && <div className={`wingo-toast ${toast.kind}`}>{toast.text}</div>}
    </main>
  );
}
