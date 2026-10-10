'use client';

import { useState } from 'react';
import { BALANCE_CHIPS, MULTIPLIERS, MAX_QUANTITY, money, selectionLabel } from './wingoLogic';

// Bottom sheet opened by any color / number / Big / Small pick — same fields
// as the original Betting__Popup: balance chip × quantity, multiplier
// shortcuts, the pre-sale agreement, and Cancel / Total amount.
export default function BetSheet({ mode, selection, initialQuantity = 1, onCancel, onConfirm, onShowRules }) {
  const [chip, setChip] = useState(BALANCE_CHIPS[0]);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [agreed, setAgreed] = useState(true);

  const total = chip * quantity;
  const tone = selection.kind === 'number' ? `n${selection.value}` : selection.value;

  const setQty = (q) => setQuantity(Math.min(MAX_QUANTITY, Math.max(1, q)));

  return (
    <div className="wingo-overlay" onClick={onCancel}>
      <div className={`wingo-sheet tone-${tone}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Place bet">
        <div className="wingo-sheet-head">
          <div className="wingo-sheet-title">{mode.label}</div>
          <div className="wingo-sheet-select">
            <span>Select</span>
            <b>{selectionLabel(selection)}</b>
          </div>
        </div>

        <div className="wingo-sheet-body">
          <div className="wingo-sheet-line">
            <span className="wingo-sheet-lbl">Balance</span>
            <div className="wingo-chip-row">
              {BALANCE_CHIPS.map((c) => (
                <button type="button" key={c} className={`wingo-chip${chip === c ? ' active' : ''}`} onClick={() => setChip(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="wingo-sheet-line">
            <span className="wingo-sheet-lbl">Quantity</span>
            <div className="wingo-qty">
              <button type="button" className="wingo-qty-btn" onClick={() => setQty(quantity - 1)} aria-label="Decrease">−</button>
              <input
                inputMode="numeric"
                value={quantity}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setQuantity(digits === '' ? 0 : parseInt(digits, 10));
                }}
                onBlur={() => setQty(quantity)}
              />
              <button type="button" className="wingo-qty-btn" onClick={() => setQty(quantity + 1)} aria-label="Increase">+</button>
            </div>
          </div>

          <div className="wingo-chip-row wingo-mult-row">
            {MULTIPLIERS.map((m) => (
              <button type="button" key={m} className={`wingo-chip${quantity === m ? ' active' : ''}`} onClick={() => setQty(m)}>
                X{m}
              </button>
            ))}
          </div>

          <label className="wingo-agree">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I agree</span>
            <button type="button" className="wingo-link" onClick={onShowRules}>《Pre-sale rules》</button>
          </label>
        </div>

        <div className="wingo-sheet-foot">
          <button type="button" className="wingo-sheet-cancel" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="wingo-sheet-confirm"
            disabled={!agreed || quantity < 1}
            onClick={() => onConfirm({ selection, amount: total })}
          >
            Total amount Rs {money(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
