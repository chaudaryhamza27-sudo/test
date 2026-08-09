"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";

const QUICK_AMOUNTS = [100, 500, 1000, 5000];
const POLL_MS = 250;

export default function GamePage() {
  const [state, setState] = useState(null);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState(100);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [authed, setAuthed] = useState(true);
  const lastPhaseRef = useRef(null);

  const loadHistory = useCallback(() => {
    fetch("/api/game/history")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setHistory(data.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/game/state", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setAuthed(data.balance !== null);
        if (lastPhaseRef.current && lastPhaseRef.current !== "WAITING" && data.phase === "WAITING") {
          loadHistory();
        }
        lastPhaseRef.current = data.phase;
        setState(data);
      } catch {
        // transient network error — next poll will retry
      }
    };

    poll();
    const t = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [loadHistory]);

  const placeBet = async () => {
    if (pending) return;
    setPending(true);
    setNotice("");
    try {
      const res = await fetch("/api/game/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || "Failed to place bet.");
        return;
      }
      setState((s) => (s ? { ...s, balance: data.balance, myBet: { amount, status: "placed", cashoutMultiplier: null, payout: 0 } } : s));
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const cashOut = async () => {
    if (pending) return;
    setPending(true);
    setNotice("");
    try {
      const res = await fetch("/api/game/cashout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || "Failed to cash out.");
        return;
      }
      setState((s) =>
        s
          ? {
              ...s,
              balance: data.balance,
              myBet: { ...s.myBet, status: "cashed_out", cashoutMultiplier: data.multiplier, payout: data.payout },
            }
          : s
      );
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const phase = state?.phase || "WAITING";
  const multiplier = state?.multiplier || 1;
  const msLeft = state?.waitingEndsAt ? Math.max(0, state.waitingEndsAt - Date.now()) : 0;
  const myBet = state?.myBet;
  const canBet = authed && phase === "WAITING" && !myBet;
  const canCashOut = authed && phase === "RUNNING" && myBet?.status === "placed";
  const planeLift = Math.min(220, Math.log(multiplier + 0.001) * 90);

  return (
    <div className="app-shell auth-page">
      <div className="app-glow g1" />
      <div className="app-glow g2" />
      <div className="app-glow g3" />

      <header className="topbar">
        <Link href="/" className="brand-logo">
          <div className="brand-mark">DA</div>
          <div className="brand-copy">
            <b>Demo Arcade</b>
            <span>Aviator — simulation</span>
          </div>
        </Link>
        <div className="demo-pill">
          <span>🧪</span> Demo mode
        </div>
      </header>

      <main className="content">
        <section className="game-history-strip">
          {history.length === 0 && <span className="game-history-empty">Round history will appear here</span>}
          {history.map((h) => (
            <span key={h.id} className={`game-history-chip ${h.crashPoint < 200 ? "low" : h.crashPoint >= 1000 ? "high" : ""}`}>
              {(h.crashPoint / 100).toFixed(2)}x
            </span>
          ))}
        </section>

        <section className="game-stage">
          <div className="game-stage-bg" />
          <div
            className={`game-plane ${phase === "CRASHED" || phase === "DONE" ? "crashed" : ""}`}
            style={{ transform: `translate(${Math.min(120, planeLift * 0.55)}px, -${planeLift}px)` }}
          >
            ✈️
          </div>

          {phase === "WAITING" && (
            <div className="game-multiplier waiting">
              <span className="game-phase-label">Next round in</span>
              <span className="game-countdown">{(msLeft / 1000).toFixed(1)}s</span>
            </div>
          )}
          {phase === "RUNNING" && (
            <div className="game-multiplier running">{multiplier.toFixed(2)}x</div>
          )}
          {(phase === "CRASHED" || phase === "DONE") && (
            <div className="game-multiplier crashed">
              <span className="game-phase-label">Flew away at</span>
              <span>{multiplier.toFixed(2)}x</span>
            </div>
          )}

          {state?.serverSeedHash && (
            <div className="game-fair-note" title={state.serverSeed ? `Seed: ${state.serverSeed}` : undefined}>
              Provably fair · commit {state.serverSeedHash.slice(0, 10)}…
            </div>
          )}
        </section>

        {!authed && (
          <div className="game-login-note">
            <Link href="/login">Log in</Link> to place demo bets. You can still watch the round live.
          </div>
        )}

        {authed && (
          <section className="deposit-card game-panel">
            <div className="card-title">
              <h2>Place your bet</h2>
              <span>Balance Rs{Number(state?.balance ?? 0).toLocaleString()}</span>
            </div>

            <div className="amount-grid">
              {QUICK_AMOUNTS.map((v) => (
                <label className="amount-option" key={v}>
                  <input type="radio" name="bet_amount" checked={amount === v} onChange={() => setAmount(v)} />
                  <div className="amount-box">
                    <div className="coin-icon">🪙</div>
                    <div>
                      <b>{v.toLocaleString()}</b>
                      <span>Demo credits</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="manual-box">
              <div className="manual-label">
                Manual Amount
                <span>Min 10</span>
              </div>
              <input
                type="number"
                min="10"
                className="manual-input"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
            </div>

            {notice && <div className="deposit-alert" style={{ marginTop: 14 }}>{notice}</div>}

            {myBet ? (
              <div className="game-bet-status">
                {myBet.status === "placed" && <span>Bet placed: Rs{myBet.amount.toLocaleString()} — good luck!</span>}
                {myBet.status === "cashed_out" && (
                  <span className="win">
                    Cashed out at {myBet.cashoutMultiplier?.toFixed(2)}x for Rs{myBet.payout?.toLocaleString()}
                  </span>
                )}
                {myBet.status === "lost" && <span className="lose">Round crashed — bet lost.</span>}
              </div>
            ) : null}

            {canCashOut ? (
              <button className="deposit-submit game-cashout-btn" onClick={cashOut} disabled={pending}>
                💸 Cash out {(myBet.amount * multiplier).toFixed(0)}
              </button>
            ) : (
              <button className="deposit-submit" onClick={placeBet} disabled={!canBet || pending}>
                🚀 {pending ? "Placing…" : `Bet ${amount ? Number(amount).toLocaleString() : 0}`}
              </button>
            )}
          </section>
        )}

        <footer className="footer" style={{ marginBottom: 24 }}>
          Aviator here is a fully simulated crash-game demo. The server determines every round's outcome in
          advance (commit-reveal) — no real money is wagered or paid out.
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}
