'use client';

import { useEffect, useState } from 'react';
import styles from './BetPanel.module.css';

/*
 * BetPanel is presentational. It never decides whether a bet is valid or what
 * a cash-out is worth — it reports intent upward and renders what it is told.
 * The parent turns onBet/onCancel/onCashOut into API calls, and the server
 * decides.
 *
 * Props
 *   phase       'betting' | 'flying' | 'crashed'
 *   multiplier  current multiplier
 *   min, max    stake limits from the server
 *   bet         null, or { stake, status: 'placed' | 'queued' | 'cashed' }
 *   busy        true while a bet/cash-out request is in flight
 *   onBet(stake, autoCashOut), onCancel(), onCashOut()
 */

const QUICK = [64, 160, 320, 1600];
const AUTO_CASHOUT_DEFAULT = 1.01;

export default function BetPanel({
  phase, multiplier = 1, min = 10, max = 5000,
  bet = null, busy = false, onBet, onCancel, onCashOut,
}) {
  const [tab, setTab] = useState('bet');            // 'bet' | 'auto'
  const [stake, setStake] = useState(min);
  const [autoCashOutOn, setAutoCashOutOn] = useState(false);
  const [autoAt, setAutoAt] = useState(AUTO_CASHOUT_DEFAULT);
  const [autoBetOn, setAutoBetOn] = useState(false);

  const clamp = (v) => Math.min(max, Math.max(min, Number(v) || min));
  const locked = !!bet && bet.status !== 'cashed';
  const flying = phase === 'flying';
  const canCashOut = flying && bet?.status === 'placed';

  const place = () => onBet(clamp(stake), autoCashOutOn ? Number(autoAt) : null);

  // Auto Bet: places a fresh bet the moment each new betting window opens.
  useEffect(() => {
    if (!autoBetOn || phase !== 'betting' || bet || busy) return;
    place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBetOn, phase]);

  const primary = () => {
    if (canCashOut) return onCashOut();
    if (locked) return onCancel();
    return place();
  };

  let label = 'Bet';
  let sub = null;
  let tone = styles.bet;
  let waiting = null;
  if (canCashOut) {
    label = 'Cash out';
    sub = (stake * multiplier).toFixed(2);
    tone = styles.cash;
  } else if (locked) {
    label = 'Cancel';
    tone = styles.cancel;
    waiting = 'Waiting for next round';
  }

  return (
    <div className={`${styles.panel} ${locked ? styles.armed : ''} ${canCashOut ? styles.active : ''}`}>
      <div className={styles.tabs}>
        <button type="button" className={tab === 'bet' ? styles.tabActive : styles.tab} onClick={() => setTab('bet')}>Bet</button>
        <button type="button" className={tab === 'auto' ? styles.tabActive : styles.tab} onClick={() => setTab('auto')}>Auto</button>
      </div>

      <div className={styles.row}>
        <div className={styles.stake}>
          <div className={styles.spinner}>
            <input
              value={stake}
              inputMode="decimal"
              disabled={locked}
              onChange={(e) => setStake(e.target.value.replace(/[^0-9.]/g, ''))}
              onBlur={() => setStake(clamp(stake))}
              aria-label="Stake"
            />
            <div className={styles.stepperGroup}>
              <button type="button" onClick={() => setStake(clamp(stake - 1))} disabled={locked}>−</button>
              <button type="button" onClick={() => setStake(clamp(Number(stake) + 1))} disabled={locked}>+</button>
            </div>
          </div>

          <div className={styles.quickGrid}>
            {QUICK.map((amt) => (
              <button key={amt} type="button" disabled={locked} onClick={() => setStake(clamp(amt))}>
                {amt}
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.actionCol} crash-action-col`}>
          {waiting && <div className={styles.waitingLabel}>{waiting}</div>}
          <button type="button" className={`${styles.action} ${tone} crash-action-btn`} onClick={primary} disabled={busy}>
            {label}
            {sub && <small>{sub}</small>}
          </button>
        </div>
      </div>

      {tab === 'auto' && (
        <div className={styles.autoRow}>
          <label className={`${styles.toggleItem} ${styles.autoBetItem}`}>
            Auto Bet
            <span className={styles.switch}>
              <input type="checkbox" checked={autoBetOn} disabled={locked} onChange={(e) => setAutoBetOn(e.target.checked)} />
              <span className={styles.track}><span className={styles.thumb} /></span>
            </span>
          </label>

          <label className={`${styles.toggleItem} ${styles.autoCashItem}`}>
            Auto Cash Out
            <span className={styles.switch}>
              <input type="checkbox" checked={autoCashOutOn} disabled={locked} onChange={(e) => setAutoCashOutOn(e.target.checked)} />
              <span className={styles.track}><span className={styles.thumb} /></span>
            </span>
          </label>

          <div className={styles.valueBox}>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={autoAt}
              disabled={!autoCashOutOn || locked}
              onChange={(e) => setAutoAt(e.target.value)}
              onBlur={() => setAutoAt(Math.max(1.01, Number(autoAt) || 1.01).toFixed(2))}
              aria-label="Auto cash out multiplier"
            />
            <span>x</span>
            <button type="button" className={styles.valueClear} aria-label="Reset to default" onClick={() => setAutoAt(AUTO_CASHOUT_DEFAULT)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}
